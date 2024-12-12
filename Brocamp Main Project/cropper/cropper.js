let cropper;
let selectedImage;

function handleImageUpload(event) {
    const files = event.target.files;
    const previewsContainer = document.getElementById('imagePreviews');
    previewsContainer.innerHTML = ''; 

    if (files.length > 3) {
        alert("Please upload a maximum of 3 images.");
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('img-thumbnail', 'mr-2');
            img.style.width = '100px';
            previewsContainer.appendChild(img);

           
            if (i === 0) { // Only for the first image for this example
                selectedImage = img.src;
                setupCropper(selectedImage);
            }
        };
        reader.readAsDataURL(files[i]);
    }

    // Show cropper options
    document.getElementById('cropperContainer').style.display = 'block';
}

function setupCropper(imageSrc) {
    const cropPreviewContainer = document.getElementById('cropPreviewContainer');
    cropPreviewContainer.innerHTML = ''; // Clear previous crop preview

    const cropperImage = document.createElement('img');
    cropperImage.src = imageSrc;
    cropPreviewContainer.appendChild(cropperImage);

    // Initialize cropper
    cropper = new Cropper(cropperImage, {
        aspectRatio: 16 / 9,
        viewMode: 1,
        ready: function () {
            // Cropper is ready
        }
    });
}

document.getElementById('cropButton').addEventListener('click', function () {
    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedImage = croppedCanvas.toDataURL('image/png');

    // Display the cropped image
    const img = document.createElement('img');
    img.src = croppedImage;
    img.classList.add('img-thumbnail', 'mr-2');
    img.style.width = '100px';
    document.getElementById('cropPreviewContainer').appendChild(img);
});
