const fs = require('fs');

// 🔴🔴 สำคัญมาก: เปลี่ยนตรงนี้เป็น URL Worker หลักของคุณ 🔴🔴
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

function encodeHex(str) {
    return Buffer.from(str, 'utf8').toString('hex');
}

function protectPlaylistUrls(jsonObj) {
    // 🟢 ระบบดำน้ำลึก (Recursive) ค้นหาโฟลเดอร์ที่ซ้อนกันกี่ชั้นก็ได้
    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        
        groups.forEach(g => {
            // ถ้าเจอหมวดหมู่สถานี (stations) ให้เริ่มเข้ารหัสลิ้งก์
            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play?data=")) {
                        const payload = s.url; 
                        s.url = `${BASE_ORIGIN}/play?data=${encodeHex(payload)}.m3u8`;
                    }
                });
            }
            // ถ้าเจอ "โฟลเดอร์ซ้อนโฟลเดอร์" (groups ซ้อน groups) ให้มุดลงไปหาต่อ!
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
