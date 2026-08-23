# How to Publish Your Extension to the Chrome Web Store

Now that your backend is live on Render, I have successfully updated the code inside your `extension` folder. It no longer points to your local machine (`localhost`), but rather connects directly to your live production API (`https://s-h-i-e-l-d-ggtx.onrender.com`).

Here is the exact implementation plan to get the extension published so anyone in the world can click "Add to Chrome" and use it:

---

## 1. Package the Extension
Chrome requires a `.zip` file of your extension.
1. On your computer, navigate to your project folder: `C:\Users\Tanisha P Paunikar\OneDrive\Desktop\npm run dev`.
2. Find the folder named `extension`.
3. Right-click the `extension` folder, click **Compress to ZIP file**.
4. You will now have a file named `extension.zip`. Keep this ready.

## 2. Register as a Chrome Developer
To publish extensions, Google requires a developer account.
1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Sign in with your Google account.
3. Pay the one-time $5.00 developer registration fee (this prevents spam bots from flooding the store).

## 3. Upload Your Extension
1. Once logged into the Developer Dashboard, click the blue **New Item** button in the top right.
2. Select the `extension.zip` file you created in Step 1.
3. Chrome will automatically read your `manifest.json` file and extract the name (S.H.I.E.L.D.) and version number.

## 4. Fill Out the Store Listing
You need to make the store page look professional. You will be asked for:
* **Description:** Write a few paragraphs explaining how S.H.I.E.L.D. works (Machine learning threat detection, typo-squatting protection, proactive blocking).
* **Screenshots:** You must upload at least one screenshot. Take a screenshot of the S.H.I.E.L.D. popup window when a site is blocked!
* **Category:** Choose "Developer Tools" or "Productivity".
* **Privacy Policy:** Chrome requires a privacy policy because your extension reads URLs. 
   - *Fix:* Create a simple Google Doc or a page on your Vercel site stating: *"S.H.I.E.L.D. reads URLs strictly for the purpose of running them against our threat-detection ML engine. We do not sell data, track users, or store personal information."* Paste the link to this document.

## 5. Submit for Review
1. Once everything is filled out, click **Submit for Review** in the top right corner.
2. The Google team will manually review the extension. Because this is a security extension, it usually takes **24 to 72 hours** to be approved.
3. Once approved, you will get a live link (e.g., `https://chrome.google.com/webstore/detail/shield/...`)!

## 6. Update Your Vercel Website
Once you have the link to the Chrome Web Store:
1. Open your code for `LandingPage.jsx`.
2. Find the "Active Extension" card.
3. Add a link or a button to that card that says "Add to Chrome" and paste your Web Store URL.
4. Commit your code to GitHub, and Vercel will automatically deploy the update!
