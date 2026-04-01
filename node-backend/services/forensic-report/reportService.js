const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE_MARGIN = 60;
const PAGE_WIDTH  = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_W   = PAGE_WIDTH - PAGE_MARGIN * 2;

class ReportService {
    static USE_AI = false; // 🔁 set true to enable Gemini

    async generateNarrative(data) {
        try {
            const defaultReport = `
    ## FORENSIC CYBERCRIME REPORT

**Report Reference:** FCR-2026-02-19-HSBC-PHISH
**Date:** 19 February 2026
**Prepared For:** [Recipient Name/Department, e.g., Head of Security Operations]
**Prepared By:** Cyber Threat Intelligence Unit

---

### 1. EXECUTIVE SUMMARY

This report details a sophisticated multi-stage phishing campaign targeting HSBC customers, identified on 19 February 2026. The attack vector originated from an SMS message impersonating HSBC, leveraging urgent language to coerce recipients into visiting a malicious URL. The URL, initially a 'tinyurl.com' shortener, redirected victims to a credential harvesting website hosted on 'fake-scam-simulation.onrender.com'. The phishing site was designed to meticulously collect a wide array of sensitive financial and personal information, including banking credentials, debit/ATM card details, OTPs, and even email passwords. Crucially, the final stage of the attack attempted to distribute a malicious Android Application Package (APK) file, indicating a sophisticated threat aimed at both credential theft and potential mobile device compromise. The overall threat level for this incident is assessed as **CRITICAL**.

### 2. INCIDENT DETAILS

**2.1. Incident Date & Time:** Analysis initiated on 19 February 2026.
**2.2. Incident Type:** Multi-stage Phishing, Credential Harvesting, Banking Fraud, Malware Distribution.
**2.3. Targeted Entity:** HSBC Bank customers.
**2.4. Initial Attack Vector:** SMS Phishing (Smishing).

**2.5. Initial Communication (Stage 1 Analysis):**
*   **Sender Identification:** The SMS originated from the phone number '+91 99999 00000'. This number is likely spoofed or a temporary burner, commonly used in fraudulent schemes to mask the true origin.
*   **Message Content:**
    '
    < Messages +91 99999 00000 Details
    HSBC Security Alert: We detected unusual activity on your account. Your access may be temporarily suspended due to a security breach. Immediate action required. To prevent access being blocked please visit https://tinyurl.com/57hcd6wb Please verify your identity within 30 minutes.
    '
*   **Social Engineering Tactics:**
    *   **Impersonation:** The message falsely claims to be from "HSBC Security Alert."
    *   **Urgency & Fear:** Phrases like "unusual activity," "temporarily suspended," "security breach," "Immediate action required," and "verify your identity within 30 minutes" are used to create panic and bypass critical thinking.
    *   **Threat:** Explicitly threatens "access being blocked" to pressure the recipient.
*   **URL Embedded:** 'https://tinyurl.com/57hcd6wb'
*   **Urgency Score:** 93/100, indicating a highly manipulative and time-sensitive demand.
*   **Flagged Phrases:** "suspended," "suspend," "immediate action."

### 3. TECHNICAL ANALYSIS

**3.1. URL Chain and Malicious Infrastructure (Stage 2 & 3 Analysis):**
*   **Initial URL:** 'https://tinyurl.com/57hcd6wb'
    *   This URL employs a legitimate URL shortening service ('tinyurl.com') to obscure the true malicious destination and bypass basic URL filtering.
    *   'tinyurl.com' has a domain age of 8789 days, which is legitimate but leveraged for malicious redirection.
*   **Final Malicious Domain:** 'fake-scam-simulation.onrender.com'
    *   The 'tinyurl' link redirects to this domain, which hosts the multi-stage phishing kit.
    *   The use of 'onrender.com' (a legitimate cloud platform) suggests the attackers are exploiting free or low-cost hosting services for their operations.
*   **Overall Threat Score:** 80/100
*   **Risk Level:** **CRITICAL**
*   **Verdict:** Score 100/100, Type: 'credential_harvesting', Confidence: 0.99.

**3.2. Attack Flow and Phishing Site Content:**
The attack employed a sophisticated multi-stage approach to harvest credentials and distribute malware:

*   **Step 1: Login Page ('https://fake-scam-simulation.onrender.com/2_login.html')**
    *   **Appearance:** Mimics a banking login page, branded with a generic "i-Secure Bank" logo, conflicting with the "HSBC" brand mentioned in the initial SMS. This branding inconsistency is a common phishing indicator.
    *   **Urgency Elements:** Displays prominent banners like "Your Account IS TEMPORARILY Blocked!" and a countdown timer "SECURITY SESSION EXPIRES IN: 02:00," designed to induce panic and hasten user input.
    *   **Credential Harvesting:** The page requests an extensive list of sensitive information via a form submitting to 'https://fake-scam-simulation.onrender.com/api/harvest-login':
        *   Login Username
        *   Login Password
        *   Transaction Password (secondary banking password)
        *   Debit/ATM Card Number, Expiry Date, CVV
        *   ATM PIN (legitimate banks never ask for PINs online)
        *   Mobile Number, Email Address
        *   Email Password (highly critical, enabling email account takeover)
        *   Grid Values (g_a through g_p) – likely for a multi-factor authentication (MFA) grid card.
    *   **Suspicious Behavior:** Form submission to an endpoint named '/api/harvest-login' is a clear indicator of credential harvesting.

*   **Step 2: OTP Verification Page ('https://fake-scam-simulation.onrender.com/3_otp.html')**
    *   **Appearance:** Continues the "i-Secure Bank" branding.
    *   **Urgency Elements:** Features another countdown timer, "Remaining Time: 01:59," to maintain pressure.
    *   **OTP Harvesting:** Requests a "6-8 DIGIT OTP" (One-Time Password) via a form submitting to 'https://fake-scam-simulation.onrender.com/api/harvest-otp'. This step is crucial for bypassing MFA, allowing attackers to complete transactions or gain full account access.
    *   **Suspicious Behavior:** Form submission to an endpoint named '/api/harvest-otp' confirms the intent to harvest MFA codes.

*   **Step 3: Success Page & Malware Distribution ('https://fake-scam-simulation.onrender.com/4_success.html')**
    *   **Appearance:** Displays a "Verification Successful" message and a fake reference ID ("REF: ISB-2026-CONF"), aiming to reassure the victim that their "profile has been successfully unblocked."
    *   **Malware Distribution:** Immediately after the fake success message, the page prompts the user to download an Android Application Package (APK) file under the guise of "Secure App Installation" for "24/7 protection." This is a common tactic to install mobile malware (e.g., banking Trojans, spyware) on the victim's device, enabling further compromise even if the initial credentials harvested are changed.
    *   **Suspicious Behavior:** The prompt to download an APK after a "security verification" is a strong indicator of a malware delivery attempt.

**3.3. Forensic Timeline of User Interaction:**
The following timeline was reconstructed from the provided data, detailing actions taken on the phishing site:
*   '1771507120517': 'page_loaded' (Initial login page)
*   '1771507121245' - '1771507122005': Multiple 'form_filled' actions (user inputting various credentials).
*   '1771507122005': 'form_submitted' (Login/credential form submitted).
*   '1771507122054': 'exfiltration' (Credentials sent to attacker's server).
*   '1771507124382': 'page_loaded' (OTP verification page).
*   '1771507124634': 'form_filled' (User inputting OTP).
*   '1771507124634': 'form_submitted' (OTP form submitted).
*   '1771507124668': 'exfiltration' (OTP sent to attacker's server).
*   '1771507126964': 'page_loaded' (Success page with APK download prompt).

**3.4. Stolen Data Types & Exfiltration:**
*   **Stolen Data Types:** Username, Password, Card Number, Expiry Date, CVV, OTP, Transaction Password, ATM PIN, Email Password, and ATM/Debit Card Grid Values.
*   **Exfiltration Server:** The data is exfiltrated to the endpoints '/api/harvest-login' and '/api/harvest-otp' on the 'fake-scam-simulation.onrender.com' domain.

### 4. EVIDENCE

*   **SMS Content:** Full text of the phishing message and sender number (+91 99999 00000).
*   **Initial Malicious URL:** 'https://tinyurl.com/57hcd6wb'.
*   **Phishing Site URLs:**
    *   'https://fake-scam-simulation.onrender.com/2_login.html' (Login/Credential Harvesting)
    *   'https://fake-scam-simulation.onrender.com/3_otp.html' (OTP Harvesting)
    *   'https://fake-scam-simulation.onrender.com/4_success.html' (Malware Distribution)
*   **Requested Sensitive Information:** A comprehensive list including login credentials, transaction passwords, full debit/ATM card details (number, expiry, CVV, PIN), email credentials, and MFA grid values/OTPs.
*   **Screenshots:** Visual records of all three pages of the phishing site (2_login.html, 3_otp.html, 4_success.html), including highlighted sections of urgency, branding, and data collection fields.
*   **Technical Analysis Data:** Entropy scores, risk breakdown, overall threat scores, and detailed breakdown of suspicious behaviors.
*   **Action Timeline:** Precise timestamps of user interactions and data exfiltration events.

### 5. IMPACT ASSESSMENT

The successful execution of this phishing campaign poses a **severe risk** to targeted individuals and, by extension, HSBC Bank's reputation and security posture. Potential impacts include:

*   **Financial Loss:** Direct unauthorized access to bank accounts, leading to fraudulent transactions.
*   **Identity Theft:** Compromise of a wide range of personal and financial identifiers.
*   **Account Takeover:** Beyond banking, the collection of email passwords could lead to compromise of other linked online accounts.
*   **Mobile Device Compromise:** If the APK is downloaded and installed, the victim's mobile device could be infected with malware (e.g., banking Trojans, remote access Trojans, spyware), leading to further data theft, surveillance, and control.
*   **Reputational Damage:** Erosion of customer trust in HSBC's security measures.
*   **Operational Disruption:** Increased burden on customer support and fraud detection teams.

### 6. RECOMMENDATIONS

**6.1. Immediate Actions:**
1.  **Block URLs:** Immediately blacklist 'https://tinyurl.com/57hcd6wb' and 'fake-scam-simulation.onrender.com' at all network egress points, email gateways, and web filtering solutions.
2.  **Alert HSBC:** Notify HSBC's security team with all relevant details for their internal fraud prevention and customer notification procedures.
3.  **Platform Abuse Report:** Report the malicious 'fake-scam-simulation.onrender.com' domain to 'onrender.com' for immediate takedown. Report the 'tinyurl.com' link to TinyURL for deactivation.
4.  **Threat Intelligence Sharing:** Share threat indicators (URLs, sender number, attack patterns) with relevant threat intelligence platforms and industry peers.
5.  **Identify Potential Victims:** Monitor for any abnormal activity related to the spoofed phone number or the phishing URLs within organizational logs.

**6.2. Preventative Measures:**
1.  **Enhanced User Education:** Conduct immediate security awareness campaigns specifically targeting phishing, smishing, and the dangers of downloading unsolicited APKs, emphasizing:
    *   Never click on suspicious links from unknown senders.
    *   Verify the sender and URL before entering credentials.
    *   Legitimate banks will never ask for ATM PINs or full card details via web forms.
    *   Always navigate directly to the official banking website or use the official mobile app.
    *   Be wary of urgent or threatening language in communications.
    *   Never download or install apps from untrusted sources.
2.  **MFA Strong Enforcement:** Encourage and enforce the use of strong Multi-Factor Authentication (MFA) across all critical accounts, noting that even OTPs can be harvested in sophisticated attacks.
3.  **Advanced Email/SMS Filtering:** Implement and continuously update advanced email and SMS filtering technologies to detect and block phishing attempts.
4.  **Endpoint Protection:** Ensure all endpoints (desktops, mobile devices) have robust and updated endpoint detection and response (EDR) solutions capable of detecting and preventing malware execution.
5.  **Regular Vulnerability Assessments:** Periodically assess organizational systems for vulnerabilities that could be exploited by similar attacks.

### 7. CONCLUSION

The analyzed phishing campaign represents a highly critical and dangerous threat, combining social engineering, comprehensive credential harvesting, and an attempt at mobile malware distribution. The sophistication of the multi-stage attack flow underscores the evolving nature of cybercrime. Prompt action is required to mitigate ongoing risks and protect potential victims from financial loss and widespread data compromise.

---
**[End of Report]**
    `;
    

            if (!ReportService.USE_AI) {
                return defaultReport;
            }

            // 🤖 AI mode
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const today = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            const prompt = `
            Today's date is ${today}.
            Write a professional forensic cybercrime report based on:
            Stage 1: ${JSON.stringify(data.stage1)}
            Stage 2: ${JSON.stringify(data.stage2)}
            Stage 3: ${JSON.stringify(data.stage3)}
            `;

            const result = await model.generateContent(prompt);
            return result.response.text();

        } catch (err) {
            console.error("Narrative generation error:", err.message);
            return "Forensic narrative generation failed.";
        }
    }


    async generatePDF(data, narrative, caseId) {

        return new Promise((resolve, reject) => {

            const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

            const fileName = `Forensic_Report_${caseId}.pdf`;

            const filePath = path.join(__dirname, '../..', 'reports', fileName);



            if (!fs.existsSync(path.dirname(filePath))) {

                fs.mkdirSync(path.dirname(filePath), { recursive: true });

            }



            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);



            // --- Header ---

            doc.font('Helvetica-Bold').fontSize(18).text('THREAT INTELLIGENCE & FRAUD ANALYSIS REPORT');

            doc.fontSize(10).font('Helvetica').text('Issued by: Phantom-Click Intelligence Unit');

            doc.moveTo(50, 85).lineTo(550, 85).strokeColor('#000000').lineWidth(1).stroke();

            doc.moveDown(2);



            // --- Metadata ---

            doc.font('Helvetica-Bold').fontSize(11).text(`CASE ID: ${caseId}`);

            doc.font('Helvetica').fontSize(10).text(`Date of Issue: ${new Date().toLocaleString('en-IN')}`);

            doc.text(`Classification: RESTRICTED / FOR OFFICIAL USE ONLY`);

            doc.moveDown(2);



            // --- Refined Section Helper (Same Line Fix) ---

            const renderCleanSection = (title, contentObj) => {

                doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(title.toUpperCase());

                doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke();

                doc.moveDown(1);

                doc.fillColor('#000000');



                const blacklist = ['pages', 'screenshots', 'actions', 'time', 'logs', 'history', 'raw'];



                for (let [key, value] of Object.entries(contentObj)) {

                    // Skip empty/blacklisted

                    if (!value || blacklist.includes(key.toLowerCase())) continue;

                    if (Array.isArray(value) && value.length === 0) continue;



                    const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toUpperCase();

                    let displayValue = "";



                    if (Array.isArray(value)) {

                        if (typeof value[0] === 'object') continue;

                        displayValue = value.join(', ');

                    } else if (typeof value === 'object') {

                        displayValue = Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(' | ');

                    } else {

                        displayValue = String(value);

                    }



                    // --- Same Line Render ---

                    doc.font('Helvetica-Bold').fontSize(10).text(`${cleanKey}: `, { continued: true });

                    doc.font('Helvetica').fontSize(10).text(displayValue, { width: 400, align: 'left' });

                    doc.moveDown(0.3);

                }

                doc.moveDown(1.5);

            };



            // --- Section 1: SMS Evidence ---

            if (data.stage1) {

                renderCleanSection('Section 1: Evidence Collected', data.stage1);

            }



            // --- Section 2: Threat Score ---

            if (data.stage2) {

                renderCleanSection('Section 2: Risk Assessment', data.stage2);

            }



            // --- Section 3: Sandbox (Relevant Info Only) ---

            if (data.stage3) {

                // Hum specifically relevant fields extract kar rahe hain

                const sandboxData = {

                    "Analysis Verdict": data.stage3.summary || "Malicious behavior detected",

                    "Data Targeted": data.stage3.stolenDataTypes, // Ab ye "Username, Password" dikhayega

                    "Exfiltration Server": data.stage3.exfiltrationServer || "Hidden/Encrypted",

                    "Security Flags": data.stage3.suspiciousBehaviors,

                    "Redirect Path": data.stage3.redirectChain ? data.stage3.redirectChain.join(' -> ') : null

                };

                renderCleanSection('Section 3: Virtual Safety Check', sandboxData);

            }



            // --- Section 4: AI Narrative ---

            if (doc.y > 600) doc.addPage();

            doc.font('Helvetica-Bold').fontSize(12).text('SECTION 4: AI GENERATED NARRATIVE');

            doc.moveTo(50, doc.y + 2).lineTo(350, doc.y + 2).stroke();

            doc.moveDown(1);

            doc.font('Helvetica').fontSize(10).text(narrative, { align: 'justify', lineGap: 3 });



            // Footer

            const range = doc.bufferedPageRange();

            for (let i = 0; i < range.count; i++) {

                doc.switchToPage(i);

                // Compute footer position using the page's dimensions and margins to avoid overflowing
                const page = doc.page;
                const footerY = page.height - page.margins.bottom - 20; // 20pt above bottom margin
                const footerWidth = page.width - page.margins.left - page.margins.right;

                doc.fontSize(8).fillColor('#999999').text(
                    `PhantomClick Forensic Unit | Case: ${caseId} | Page ${i + 1} of ${range.count}`,
                    page.margins.left,
                    footerY,
                    { width: footerWidth, align: 'center' }
                );

            }



            doc.end();

            stream.on('finish', () => resolve(fileName));

            stream.on('error', reject);

        });

    }
}

module.exports = new ReportService();