// DOM Elements
const landing = document.getElementById('landing');
const encryptLanding = document.getElementById('encrypt-landing');
const decryptLanding = document.getElementById('decrypt-landing');
const encryptWorkspace = document.getElementById('encrypt-workspace');
const decryptWorkspace = document.getElementById('decrypt-workspace');
const publicKeyModal = document.getElementById('public-key-modal');
const privateKeyModal = document.getElementById('private-key-modal');
const toast = document.getElementById('toast');

// Initialize app based on URL parameters
const initializeApp = async () => {
    // Check for ?to= parameter
    const urlParams = new URLSearchParams(window.location.search);
    const toEmail = urlParams.get('to');
    
    if (toEmail) {
        // Switch to encrypt mode
        landing.style.display = 'none';
        encryptWorkspace.classList.remove('hidden');
        encryptWorkspace.classList.add('active');
        
        // Set the email in the input
        const keyLookupInput = document.getElementById('key-lookup-input');
        keyLookupInput.value = toEmail;
        
        // Attempt to fetch the key
        await lookupKey(toEmail);
    }
};

// Show error toast
const showError = (message) => {
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 5000);
};

const copyToClipboard = async (textareaId) => {
    const textarea = document.getElementById(textareaId);
    const button = document.querySelector(`button[id^="copy-${textareaId}"]`);
    
    try {
        await navigator.clipboard.writeText(textarea.value);
        
        // Add transition classes first
        button.classList.add('bg-primary', 'border-primary');
        
        // Use requestAnimationFrame to ensure smooth transition
        requestAnimationFrame(() => {
            button.textContent = 'Copied!';
        });
        
        // Reset after delay
        setTimeout(() => {
            // First reset the text
            button.textContent = 'Copy';
            // Then remove the classes after a small delay to allow text to settle
            setTimeout(() => {
                button.classList.remove('bg-primary', 'border-primary');
            }, 50);
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        showError('Failed to copy to clipboard');
    }
};

// Landing page handlers
encryptLanding.addEventListener('click', () => {
    landing.style.display = 'none';
    encryptWorkspace.classList.remove('hidden');
    encryptWorkspace.classList.add('active');
});

decryptLanding.addEventListener('click', () => {
    landing.style.display = 'none';
    decryptWorkspace.classList.remove('hidden');
    decryptWorkspace.classList.add('active');
});

// Modal handlers
document.getElementById('show-public-key').addEventListener('click', () => {
    publicKeyModal.classList.remove('hidden');
    publicKeyModal.classList.add('flex');
});

document.getElementById('show-private-key').addEventListener('click', () => {
    privateKeyModal.classList.remove('hidden');
    privateKeyModal.classList.add('flex');
});

document.getElementById('close-public-key').addEventListener('click', () => {
    publicKeyModal.classList.add('hidden');
    publicKeyModal.classList.remove('flex');
});

document.getElementById('close-private-key').addEventListener('click', () => {
    privateKeyModal.classList.add('hidden');
    privateKeyModal.classList.remove('flex');
});

document.getElementById('close-toast').addEventListener('click', () => {
    toast.classList.add('hidden');
});

// Encryption handler
document.getElementById('encrypt-button').addEventListener('click', async () => {
    const publicKeyArmored = document.getElementById('public-key').value.trim();
    const messageText = document.getElementById('encrypt-input').value.trim();

    if (!publicKeyArmored) {
        showError('Please specify the recipient or configure public key');
        return;
    }

    if (!messageText) {
        showError('Please enter a message to encrypt');
        return;
    }

    try {
        // Read the key and force it to be treated as an encryption key
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        
        // Create a message with specific format options
        const message = await openpgp.createMessage({ 
            text: messageText,
            format: 'utf8'
        });

        // Use more specific encryption options
        const encrypted = await openpgp.encrypt({
            message,
            encryptionKeys: [publicKey],
            config: {
                preferredCompressionAlgorithm: openpgp.enums.compression.uncompressed,
                aeadProtect: false,
                allowUnauthenticatedMessages: true
            }
        });

        document.getElementById('encrypt-input').value = encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        
        // More detailed error message
        const errorMessage = error.message.includes('Could not find primary user') 
            ? 'This public key appears to be missing some metadata. Please ensure you have the complete and correct public key.'
            : `Encryption failed: ${error.message}`;
            
        showError(errorMessage);
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

// Key lookup functionality
const lookupKey = async (query) => {
    try {
        let url;
        // Check if the query looks like a fingerprint (40 hex characters)
        if (/^[A-Fa-f0-9]{40}$/.test(query)) {
            url = `https://keys.openpgp.org/vks/v1/by-fingerprint/${query}`;
        } else {
            // Assume it's an email address
            url = `https://keys.openpgp.org/vks/v1/by-email/${encodeURIComponent(query)}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Key not found. Please check the fingerprint or email and try again.');
        }

        const key = await response.text();
        document.getElementById('public-key').value = key;
    } catch (error) {
        showError(error.message);
    }
};

document.getElementById('key-lookup-input').addEventListener('blur', async (e) => {
    const query = e.target.value.trim();
    
    if (!query) {
        showError('Please enter a fingerprint or email address');
        return;
    }

    await lookupKey(query);
});

// Update copy button handlers
document.getElementById('copy-encrypt-input').addEventListener('click', () => {
    copyToClipboard('encrypt-input');
});

document.getElementById('copy-decrypt-input').addEventListener('click', () => {
    copyToClipboard('decrypt-input');
});

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
