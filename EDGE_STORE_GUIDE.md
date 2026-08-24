# Publishing S.H.I.E.L.D. to the Microsoft Edge Add-ons Store

Publishing your extension to Microsoft Edge is a great decision. Edge uses the same underlying technology as Chrome (Chromium), so your extension will work perfectly without changing any code. Best of all, **Microsoft does not charge a developer fee**.

Follow these exact steps to get S.H.I.E.L.D. into the official store:

---

## Step 1: Zip Your Extension Code
1. On your computer, navigate to your project folder: `C:\Users\Tanisha P Paunikar\OneDrive\Desktop\npm run dev`.
2. Locate the folder named `extension`.
3. Right-click the `extension` folder and select **Compress to ZIP file** (or "Send to > Compressed (zipped) folder").
4. Name the new file `shield-edge.zip`.

## Step 2: Register as an Edge Developer (100% Free)
1. Go to the [Microsoft Partner Center for Edge](https://partner.microsoft.com/en-us/dashboard/microsoftedge).
2. Sign in using any Microsoft account (Outlook, Hotmail, Xbox, etc.).
3. You will be asked to fill out your developer details (Name, Email, Country). The "Developer Name" you choose here is what users will see (e.g., "Tanisha Paunikar").
4. Accept the terms and conditions. There is **no payment required**.

## Step 3: Upload Your Code
1. Once inside the Partner Center dashboard, click on the **Create new extension** button on the top right.
2. The page will ask you to upload your package. Drag and drop the `shield-edge.zip` file you created in Step 1.
3. Microsoft's system will automatically read your `manifest.json` file and recognize that the extension is named "S.H.I.E.L.D.".
4. Once the progress bar reaches 100%, click **Next**.

## Step 4: Fill Out the Store Details
You need to tell users what your extension does. Fill out the fields as follows:

* **Description:** 
  > S.H.I.E.L.D. (Smart Heuristic Intelligence for Evaluating Links & Domains) is a proactive cybersecurity extension. Instead of relying on outdated blocklists, S.H.I.E.L.D. uses real-time machine learning heuristics to analyze the deep structure of URLs. It instantly intercepts and blocks zero-day phishing attacks, typosquatting attempts, and malicious lookalike domains before they can load.
* **Search Terms:** `security`, `anti-phishing`, `cybersecurity`, `malware protection`, `url scanner`
* **Privacy Policy URL:** Because the extension scans the websites the user visits, a privacy policy is required.
  * **Quick Fix:** Create a public Google Doc and paste its sharing link here. The document only needs to say: *"S.H.I.E.L.D. reads browser URLs exclusively for the purpose of analyzing them for phishing threats via our machine learning engine. We do not sell data, we do not track users, and we do not store personal information."*

## Step 5: Upload Store Images
Microsoft requires specific image sizes to make your store page look professional. You can easily create these in a free tool like Canva or MS Paint:
1. **Extension Logo (300 x 300 pixels):** A simple square image. You can just use a green shield icon on a black background.
2. **Small Promotional Tile (440 x 280 pixels):** This is the banner image that shows up in search results.
3. **Screenshots (1280 x 800 pixels):** Take a screenshot of the S.H.I.E.L.D. Vercel dashboard, and a screenshot of the red "BLOCKED" screen when a bad link is clicked. Upload them here.

## Step 6: Submit for Certification
1. Review all the information to make sure it looks good.
2. Click the **Publish** button at the bottom of the screen.
3. **Wait for Review:** Your extension is now in the "Certification" phase. A real human at Microsoft will review the code to ensure it isn't malware. This process typically takes **1 to 3 business days**.

Once approved, Microsoft will send you an email with your official Edge Store link! You can then add this link to your resume and your Vercel website!
