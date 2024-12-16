const cheackoutDB = require('../../schema/cheakout');
const product = require('../../schema/productschema');
const address = require('../../schema/address')
const offerDB = require('../../schema/offerSchema')
const coupunDB = require('../../schema/coupunSchama')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const walletDB = require('../../schema/wallet')
const productDB = require('../../schema/productschema')
const categoryDB = require('../../schema/category')

exports.getordermanage = async (req, res) => {
  let limit = 10
  const page = parseInt(req.query.page) || 1
  const skip = (page - 1) * limit;

  const totalOrders = await cheackoutDB.countDocuments();


  const totalPages = Math.ceil(totalOrders / limit);

  const out = await cheackoutDB
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userID');

  // const out = await cheackoutDB.find().limit(limit).skip(skip).sort({createdAt:-1}).populate('userID')
  res.render('admin/ordermanage', {
    out: out,
    currentPage: page,
    totalPages: totalPages,
  })

};

exports.changestatus = async (req, res) => {
  const { orderid, status } = req.body

  const nowdate = new Date();
  if (status == 'canceled') {

    const order = await cheackoutDB.findById(orderid)

    const userid = order.userID

    if (order.paymentMethods == 'razorpay' || order.paymentMethods == 'wallet') {
      order.status = 'canceled';
      await order.save()

      const wallet = await walletDB.findOne({ user: userid })

      if (wallet) {


        const existingWallet = await walletDB.findOne({ user: userid }, { amount: 1, _id: 0 });

        if (!existingWallet) {
          throw new Error('Wallet not found for user');
        }

        const newAmount = wallet.amount += order.totalprice
        await walletDB.updateOne(
          { user: userid },
          {
            amount: newAmount,
            $push: {
              transaction: {
                typeoftransaction: 'debit',
                amountOfTransaction: order.totalprice,
                dateOfTransaction: nowdate,
              }
            }
          }
        ).then(() => console.log('Successfully updated the wallet'));

        const productsInorder = order.products

        for (let item of productsInorder) {
          const productid = item.productId
          const qty = item.qty

          const product = await productDB.findById(productid)

          if (product) {
            const category = await categoryDB.findById(product.category)

            if (category) {
              let categorysold = Number(category.sold -= qty)

              category.sold = categorysold
              await category.save()
            }

          }


          if (product) {
            const productqty = Number(product.quantity += qty)
            const soldqty = Number(product.sold -= qty)
            await productDB.findByIdAndUpdate(productid, {
              quantity: productqty,
              sold: soldqty
            })
          } else {

            // console.log(`Product with ID ${item.productId} does not exist. Skipping...`);
            continue; // Skip this iteration and move to the next item

          }





        }



      } else {
        // return console.log('this is from non existing wallet ')
        const newwallet = new walletDB({
          amount: order.totalprice,
          user: userid,
          transaction: [{
            typeoftransaction: 'debit',
            amountOfTransaction: order.totalprice,
            dateOfTransaction: nowdate
          }]
        })

        await newwallet.save()


        const productsInorder = order.products

        for (let item of productsInorder) {
          const productid = item.productId
          const qty = item.qty

          const product = await productDB.findById(productid)


          const category = await categoryDB.findById(product.category)

          if (category) {


            let categorysold = Number(category.sold -= qty)

            category.sold = categorysold
            await category.save()
          }


          if (product) {

            const productqty = Number(product.quantity += qty)
            const soldqty = Number(product.sold -= qty)
            await productDB.findByIdAndUpdate(productid, {
              quantity: productqty,
              sold: soldqty
            })

          } else {
            continue;

          }



        }

      }
      return res.json({
        success: true,
        message: 'Order status updated successfully'
      });
    } else {

      order.status = 'canceled';
      await order.save()

      const productsInorder = order.products

      for (let item of productsInorder) {
        const productid = item.productId
        const qty = item.qty

        const product = await productDB.findById(productid)



        if (product) {
          const productqty = Number(product.quantity += qty)
          const soldqty = Number(product.sold -= qty)
          await productDB.findByIdAndUpdate(productid, {
            quantity: productqty,
            sold: soldqty
          })
        } else {

          // console.log(`Product with ID ${item.productId} does not exist. Skipping...`);
          continue; // Skip this iteration and move to the next item

        }




      }

      return res.json({
        success: true,
        message: 'Order status updated successfully'
      });

    }

  } else {
    await cheackoutDB.findByIdAndUpdate({ _id: orderid }, { status: status }).then(() => console.log('success'))
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  }



}


// exports.getsalesreport= async (req,res)=>{

// console.log(req.query.filter)

//   res.render('admin/salesreport')
//   // console.log(req.query.filter)


// } 
exports.getsalesreport = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    let query = { status: { $nin: ['canceled', 'return', 'payment-pending'] } };
    let finalStartDate = new Date();
    let finalEndDate = new Date();

    if (startDate > endDate) {
      // console.log('entered to the condition code ')
      req.flash('date', 'cannot start date less than send date ')
      return res.redirect('/admin/salesreport')
    }

    if (filter) {
      switch (filter) {
        case 'daily':
          finalStartDate.setHours(0, 0, 0, 0);
          finalEndDate = new Date();
          break;
        case 'weekly':
          finalStartDate.setDate(finalStartDate.getDate() - 7);
          break;
        case 'monthly':
          finalStartDate.setMonth(finalStartDate.getMonth() - 1);
          break;
        case 'yearly':
          finalStartDate.setFullYear(finalStartDate.getFullYear() - 1);
          break;
        default:
          break;
      }
    }
 

    if (startDate && endDate) {
      finalStartDate = new Date(startDate) || Date.now();
      finalEndDate = new Date(endDate);
    }

    query.createdAt = {
      $gte: finalStartDate,
      $lte: finalEndDate

    };
    let page = parseInt(req.query.page) || 1;
    let limit = 10;
    let skip = (page - 1) * limit;
 
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID')

    const salesDatas = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
 
    const totalSales = await cheackoutDB.countDocuments(query);
    const totalPages = Math.ceil(totalSales / limit); // Total pages



    let totalOrders = salesData.length;
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let totalDiscount = 0;


    const offer = await cheackoutDB.aggregate([
      { $match: { createdAt: { $gte: finalStartDate }, status: { $in: ['shipped', 'pending', 'delevered'] } } },
      { $group: { _id: null, totaloffer: { $sum: '$discount' } } },
      { $project: { _id: 0, totaloffer: 1 } }
    ]);

    const totalOffer = offer.length > 0 ? offer[0].totaloffer : 0;
    totalDiscount += totalOffer

 

    // this is the original 
    // const coupunoffer = await coupunDB.find().populate('user');



    const coupunoffer = await coupunDB.find({ createdAt: finalStartDate, expiryDate: finalEndDate }).populate('user');

    const coupundiscount = coupunoffer.reduce((ini, item) => {
      const prices = item.maximumDiscount || 0;
      const userCount = Array.isArray(item.user) ? item.user.length : 0;
      const totaldiscount = prices * userCount;
      ini += totaldiscount;
      return ini;
    }, 0);

    const coupunAmount = await cheackoutDB.aggregate([
      { $match: { createdAt: { $gte: finalStartDate, $lte: finalEndDate }, status: { $nin: ['return,canceled'] } } }, { $group: { _id: null, coupun: { $sum: '$applayedcoupun' } } }, { $project: { _id: 0, coupun: 1 } }
    ])
     
    totalDiscount += coupunAmount[0]?.coupun || 0
 

    salesData.forEach(order => {
      totalRevenue += order.totalprice || 0;
      totalItemsSold += order.products.reduce((sum, product) => sum + product.qty, 0);



    });
    req.session.totalOrders = totalOrders
    req.session.totalRevenue = totalRevenue
    req.session.totalDiscount = totalDiscount
 
    res.render('admin/salesreport', {
      totalOrders,
      totalRevenue,
      totalItemsSold,
      totalDiscount,
      salesDatas,
      valid: req.flash('date'),
      currentPage: page,
      totalPages

    });
  } catch (error) {
    console.error('Error generating sales report:', error);

  }
};


exports.downloadpdf = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    
 
    let start = new Date();
    let end = new Date();
  
    if (startDate && endDate) {
    
      start = new Date(startDate);
      end = new Date(endDate);
    }

    if (filter) {
      switch (filter) {
        case 'daily':
   
          start.setHours(0, 0, 0, 0);

          break;
        case 'weekly':
          // console.log('entered to the weekly ')
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'yearly':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          break;
      }
    }


    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }
 

    const query = { createdAt: { $gte: start, $lte: end }, status: { $nin: ['return', 'canceled'] } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (!salesData.length) {
      req.flash('date', 'there is no data within this date range ')
      return res.redirect('/admin/salesreport')
    }


    const doc = new PDFDocument();

    const filePath = path.join(__dirname, '..', '..', 'public', 'sales_report.pdf');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }


    doc.pipe(fs.createWriteStream(filePath));



    // doc.fontSize(20).text('Sales Report', { align: 'center' });
    // doc.text(`totalOrder : ${req.session.totalOrders}`)
    // doc.text(`revenew : ${req.session.totalRevenue}`)
    // doc.text(`discount :${req.session.totalDiscount}`)
    // doc.moveDown();

    // salesData.forEach((sale, index) => {
    //   doc.fontSize(12).text(`Order ${index + 1}`);
    //   doc.text(`User: ${sale.userID.username}`);
    //   doc.text(`Order ID: ${sale._id}`);
    //   doc.text(`Net Sales: ₹${sale.totalprice}`);
    //   doc.text(`discount : ${sale.discount}`);
    //   doc.text(`Date: ${sale.createdAt}`);

    //   doc.moveDown();
    // });

    // doc.end();

    // Add a title page with styling
    doc.fontSize(28)
      .fillColor('#2C3E50')
      .text('Sales Report', { align: 'center' })
      .moveDown(0.5);

    doc.fontSize(12)
      .fillColor('#7F8C8D')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(1.5);

    doc.rect(50, doc.y, 500, 100)
      .fillColor('#F8F9FA')
      .fill();

    doc.y -= 90;

    doc.fontSize(16)
      .fillColor('#2C3E50')
      .text(`Total Orders: ${req.session.totalOrders}`, { align: 'left', indent: 20 })
      .text(`Revenue: ₹${req.session.totalRevenue}`, { align: 'left', indent: 20 })
      .text(`Discount: ₹${req.session.totalDiscount}`, { align: 'left', indent: 20 })
      .moveDown(2);

    doc.moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();

    salesData.forEach((sale, index) => {

      if (index % 2 === 0) {
        doc.rect(50, doc.y - 5, 500, 80)
          .fillColor('#F8F9FA')
          .fill();
      }

      doc.fillColor('#2C3E50')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Order ${index + 1}`, { continued: true })
        .font('Helvetica')
        .fontSize(12)
        .text(`    Date: ${new Date(sale.createdAt).toLocaleDateString()}`, { align: 'right' });

      doc.fontSize(12)
        .font('Helvetica')
        .text(`Customer: ${sale.userID.username}`, { indent: 20 })
        .text(`Order ID: ${sale._id}`, { indent: 20 })
        .text(`Net Sales: ₹${sale.totalprice}`, { indent: 20 })
        .text(`Discount: ₹${sale.discount}`, { indent: 20 })
        .moveDown();

      if (index < salesData.length - 1) {
        doc.moveTo(70, doc.y)
          .lineTo(530, doc.y)
          .strokeColor('#E0E0E0')
          .stroke()
          .moveDown(0.5);
      }

      if (doc.y > 700) {
        doc.addPage();
      }
    });

    // Add footer
    doc.fontSize(10)
      .text('End of Sales Report', { align: 'center' });

    doc.end();


    res.download(filePath, 'sales_report.pdf', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending PDF');
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};




exports.downloadExcel = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    let start = new Date()
    let end = new Date()


    if (filter) {
      switch (filter) {
        case 'daily':
          start = start.setHours(0, 0, 0, 0)
          break;
        case 'weekly':
          start = start.setDate(start.getDate() - 7)
          break;
        case 'monthly':
          start = start.setDate(start.getMonth() - 1)
          break;

        case 'yearly':
          start = start.setFullYear(start.getFullYear() - 1)
          break;

        default:
     
          break


      }
    }

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

    }


    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send('Invalid date format');
    }

    const query = { createdAt: { $gte: start, $lte: end }, status: { $nin: ['return', 'canceled'] } };
    const salesData = await cheackoutDB.find(query)
      .populate('products.productId')
      .populate('userID');

    if (startDate > endDate) {

      req.flash('date', 'Start Date must be less than end date ,please enter a valid date ')
      return res.redirect('/admin/salesreport')
    }

    if (!salesData.length) {
      req.flash('date', 'there is no data within this Date Range ')
      return res.redirect('/admin/salesreport')
    }

    const formattedData = salesData.map((sale, index) => ({
      Order: index + 1,
      User: sale.userID.username,
      'Order ID': sale._id.toString(),
      'Net Sales': `₹${sale.totalprice}`,
      Discount: sale.discount,
      Date: sale.createdAt.toISOString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(formattedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    const filePath = path.join(__dirname, '..', '..', 'public', 'sales_report.xlsx');

    xlsx.writeFile(workbook, filePath);

    res.download(filePath, 'sales_report.xlsx', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending Excel file');
      }

      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel');
  }
};


exports.orderview = async (req, res) => {
  // console.log(req.params.id)
  let ID = req.params.id
  const order = await cheackoutDB.findById(ID).populate('products.productId')
  const discount = order.discount
  const realprice = Number(order.totalprice + discount + order.applayedcoupun)
  // return res.json(order) 
  res.render('admin/orderview', { order, discount, realprice })

}