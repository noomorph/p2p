// DOM Elements
const landing = document.getElementById('landing');
const encryptLanding = document.getElementById('encrypt-landing');
const decryptLanding = document.getElementById('decrypt-landing');
const encryptWorkspace = document.getElementById('encrypt-workspace');
const decryptWorkspace = document.getElementById('decrypt-workspace');
const publicKeyModal = document.getElementById('public-key-modal');
const privateKeyModal = document.getElementById('private-key-modal');
const toast = document.getElementById('toast');

// Load keys from localStorage
const loadSavedKeys = () => {
    const publicKey = localStorage.getItem('publicKey');

    if (publicKey) {
        document.getElementById('public-key').value = publicKey;
        document.getElementById('persist-public-key').checked = true;
    }
};

// Save keys to localStorage
const saveKeys = () => {
    const publicKey = document.getElementById('public-key').value;
    const shouldPersistPublic = document.getElementById('persist-public-key').checked;

    if (shouldPersistPublic && publicKey) {
        localStorage.setItem('publicKey', publicKey);
    } else {
        localStorage.removeItem('publicKey');
    }
};

// Show error toast
const showError = (message) => {
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 5000);
};

const copyToClipboard = async (textareaId) => {
    const textarea = document.getElementById(textareaId);
    await navigator.clipboard.writeText(textarea.value);
};

// Landing page handlers
encryptLanding.addEventListener('click', () => {
    landing.style.display = 'none';
    encryptWorkspace.classList.add('active');
});

decryptLanding.addEventListener('click', () => {
    landing.style.display = 'none';
    decryptWorkspace.classList.add('active');
});

// Modal handlers
document.getElementById('show-public-key').addEventListener('click', () => {
    publicKeyModal.classList.add('active');
});

document.getElementById('show-private-key').addEventListener('click', () => {
    privateKeyModal.classList.add('active');
});

document.getElementById('close-public-key').addEventListener('click', () => {
    publicKeyModal.classList.remove('active');
    saveKeys();
});

document.getElementById('close-private-key').addEventListener('click', () => {
    privateKeyModal.classList.remove('active');
    saveKeys();
});

document.getElementById('close-toast').addEventListener('click', () => {
    toast.classList.remove('active');
});

// Encryption handler
document.getElementById('encrypt-button').addEventListener('click', async () => {
    const publicKeyArmored = document.getElementById('public-key').value.trim();
    const messageText = document.getElementById('encrypt-input').value.trim();

    if (!publicKeyArmored) {
        showError('Please configure your public key first');
        return;
    }

    if (!messageText) {
        showError('Please enter a message to encrypt');
        return;
    }

    try {
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const message = await openpgp.createMessage({ text: messageText });
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: publicKey
        });

        document.getElementById('encrypt-input').value = encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        showError('Encryption failed. Please check your public key and try again.');
    }
});

// Decryption handler
document.getElementById('decrypt-button').addEventListener('click', async () => {
    const privateKeyArmored = document.getElementById('private-key').value.trim();
    const passphrase = document.getElementById('private-key-passphrase').value;
    const encryptedMessage = document.getElementById('decrypt-input').value.trim();

    if (!privateKeyArmored) {
        showError('Please configure your private key first');
        return;
    }

    if (!encryptedMessage) {
        showError('Please enter an encrypted message to decrypt');
        return;
    }

    try {
        console.log('Starting decryption process...');

        // Read the private key
        const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored })
            .catch(err => {
                console.error('Error reading private key:', err);
                throw new Error('Invalid private key format');
            });

        console.log('Private key read successfully');

        // Decrypt the private key if it's encrypted
        const decryptedPrivateKey = await openpgp.decryptKey({
            privateKey,
            passphrase
        }).catch(err => {
            console.error('Error decrypting private key:', err);
            throw new Error('Invalid passphrase for private key');
        });

        console.log('Private key decrypted successfully');

        const message = await openpgp.readMessage({
            armoredMessage: encryptedMessage
        }).catch(err => {
            console.error('Error reading encrypted message:', err);
            throw new Error('Invalid encrypted message format');
        });

        console.log('Encrypted message read successfully');
        console.log('Message info:', {
            encrypted: message.encrypted,
            packets: message.packets
        });

        const { data: decrypted } = await openpgp.decrypt({
            message,
            decryptionKeys: decryptedPrivateKey,
            format: 'utf8'
        }).catch(err => {
            console.error('Decryption operation failed:', err);
            if (err.message.includes('Session key decryption failed')) {
                throw new Error('This message was not encrypted for this private key');
            }
            throw err;
        });

        console.log('Decryption successful');
        document.getElementById('decrypt-input').value = decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        showError(`Decryption failed: ${error.message}`);
    }
});


// Add click handlers for each copy button
document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', () => {
        const textarea = button.previousElementSibling;
        copyToClipboard(textarea.id);
    });
});

// Load saved keys on startup
loadSavedKeys();
