const form = document.getElementById('uploadForm');
const imageInput = document.getElementById('image');
const message = document.getElementById('message');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const submitButton = document.getElementById('submitButton');
const uploadSpinner = document.getElementById('uploadSpinner');
const buttonLabel = submitButton?.querySelector('.button-label');

function setMessage(type, text) {
    message.classList.remove('success', 'error');
    message.textContent = text || '';

    if (type && text) {
        message.classList.add(type);
    }
}

function clearPreview() {
    imagePreview.removeAttribute('src');
    previewContainer.classList.add('hidden');
}

function updatePreview(file) {
    if (!file || !file.type.startsWith('image/')) {
        clearPreview();
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target?.result || '';
        previewContainer.classList.remove('hidden');
    };
    reader.onerror = () => {
        clearPreview();
        setMessage('error', 'Unable to preview the selected image.');
    };
    reader.readAsDataURL(file);
}

function setUploadingState(isUploading) {
    submitButton.disabled = isUploading;
    uploadSpinner.classList.toggle('hidden', !isUploading);
    buttonLabel.textContent = isUploading ? 'Uploading...' : 'Upload';
}

imageInput.addEventListener('change', () => {
    setMessage('', '');
    updatePreview(imageInput.files?.[0]);
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('', '');
    setUploadingState(true);

    const formData = new FormData(form);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            setMessage('success', result.message || 'Upload successful.');
            form.reset();
            clearPreview();
        } else {
            setMessage('error', result.error || 'Upload failed.');
        }
    } catch (error) {
        console.error(error);
        setMessage('error', 'Something went wrong during upload.');
    } finally {
        setUploadingState(false);
    }
});
