# Pass the Pass 🔐

A sleek, browser-based secure message exchange application that enables end-to-end encrypted communication between peers. This lightweight tool allows users to easily encrypt and decrypt messages using public-key cryptography, all while keeping your sensitive data secure.

## Features ✨

- **End-to-End Encryption**: Secure message encryption using public-key cryptography
- **No Server Storage**: All encryption happens in your browser - no messages are stored on any server
- **Simple Interface**: Clean, intuitive UI for both sending and receiving encrypted messages
- **Copy with One Click**: Easy-to-use copy buttons for sharing encrypted content
- **Mobile-Friendly**: Responsive design that works great on both desktop and mobile devices

## How It Works 🛠️

1. **To Send a Message:**
   - Click "I want to send text"
   - Enter your message
   - Configure the recipient's public key
   - Encrypt your message
   - Copy and share the encrypted text

2. **To Read a Message:**
   - Click "I want to read encrypted text"
   - Paste the encrypted message
   - Use your private key to decrypt
   - Read the original message

## Getting Started 🚀

1. Clone this repository
2. Open `index.html` in your web browser
3. No installation or setup required!

## Technologies Used 💻

- HTML/CSS/JavaScript
- OpenPGP.js v6.1.0 for cryptographic operations

## Security Notes 🛡️

- All cryptographic operations are performed locally in your browser
- Your private keys never leave your device
- Uses OpenPGP.js with modern cryptographic standards:
  - RSA-4096 or Ed25519 for key pairs
  - AES-256 for symmetric encryption
  - SHA-256 for hashing
- Open-source and auditable code

### Recommendations for Maximum Security

- Use Incognito/Private browsing mode to ensure no data persists
- Disable browser extensions when using this tool to prevent potential data access
- Clear browser data after use if not using Incognito mode
- Verify the recipient's public key through a secure channel
- Optional: Public keys can be saved in browser storage for convenience, but this reduces privacy
- Generate your keys using trusted tools like GPG or Kleopatra - do not use online key generators
- JavaScript is required and must be enabled - the app won't work without it as all cryptographic operations are JavaScript-based

## License 📄

This project is open source and available under the MIT License.

---

Made with ❤️ for secure communication 