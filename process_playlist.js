const fs = require('fs');

// 🔴 โดเมนด่านหน้าของคุณ
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// ฟังก์ชันเข้ารหัส Base64 (ซ่อน URL)
function encodeBase64Proxy(str) {
    const expiryDate = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);
    const jsonPayload = JSON.stringify({ u: str, e: expiryDate });
    return Buffer.from(encodeURIComponent(jsonPayload)).toString('base64');
}

// 🛡️ [แก้บั๊กหลัก] แยกร่าง Header ออกมาก่อนเข้ารหัส Base64
function protectPlaylistUrls(jsonObj) {
    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play.m3u8?t=")) {
                        
                        // 🌟 ดึง Header (เครื่องหมาย |) ออกมาก่อน ไม่ให้โดนเข้ารหัสไปด้วย
                        let parts = s.url.split('|');
                        let actualUrl = parts[0];
                        let headersPart = parts.length > 1 ? "|" + parts.slice(1).join('|') : "";
                        
                        // นำ Header ไปแปะไว้ท้ายสุดด้านนอก Base64 เพื่อให้แอป Wiseplay มองเห็นและนำไปใช้งานต่อได้
                        s.url = `${BASE_ORIGIN}/play.m3u8?t=${encodeBase64Proxy(actualUrl)}${headersPart}`;
                    }
                });
            }
            if (g.groups && Array.isArray(g.groups)) {
                processGroups(g.groups);
            }
        });
    }

    if (jsonObj && jsonObj.groups) {
        processGroups(jsonObj.groups);
    }
    return jsonObj;
}

function processFile(inputFile, outputFile) {
    if (fs.existsSync(inputFile)) {
        console.log(`⏳ กำลังอ่านไฟล์ ${inputFile}...`);
        const rawData = fs.readFileSync(inputFile, 'utf8');
        const parsedData = JSON.parse(rawData);

        console.log(`🔒 กำลังเข้ารหัสลิ้งก์สำหรับ ${inputFile}...`);
        const protectedData = protectPlaylistUrls(parsedData);

        console.log(`💾 กำลังบันทึกไฟล์ ${outputFile}...`);
        fs.writeFileSync(outputFile, JSON.stringify(protectedData));
        console.log(`✅ ประมวลผล ${outputFile} สำเร็จ!`);
    } else {
        console.log(`⚠️ ไม่พบไฟล์ ${inputFile} ข้ามการทำงาน`);
    }
}

try {
    processFile('raw_filmhub.json', 'filmhub.json');
    processFile('raw_serieshub.json', 'serieshub.json');
    console.log("🎉 เสร็จสิ้นทั้งหมด!");
} catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.message);
    process.exit(1);
}
