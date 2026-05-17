const fs = require('fs');

// 🔴 โดเมนด่านหน้าของคุณ
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// ฟังก์ชันเข้ารหัส Base64 (ซ่อน URL) แบบตรงไปตรงมาที่สุด
function encodeBase64Proxy(str) {
    const expiryDate = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);
    const jsonPayload = JSON.stringify({ u: str, e: expiryDate });
    return Buffer.from(encodeURIComponent(jsonPayload)).toString('base64');
}

// 🛡️ [แก้บั๊ก] แปลงลิ้งก์แบบ "ดึงตรงๆ" ไม่แยก ไม่หั่น ไม่เปลี่ยนนามสกุล
function protectPlaylistUrls(jsonObj) {
    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    // ข้าม URL ที่ถูกเข้ารหัสไปแล้ว
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play.m3u8?t=")) {
                        
                        // 🌟 จับลิ้งก์ดิบมาตรงๆ ยัดเข้า Base64 แล้วใส่ /play.m3u8 เลย! (เหมือนรูปที่คุณส่งมาเป๊ะๆ)
                        s.url = `${BASE_ORIGIN}/play.m3u8?t=${encodeBase64Proxy(s.url)}`;
                        
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
