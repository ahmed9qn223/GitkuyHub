const fs = require('fs');

// 🔴 เปลี่ยนตรงนี้เป็น URL Worker หลักของคุณ
const BASE_ORIGIN = "[https://your-worker-domain.workers.dev](https://your-worker-domain.workers.dev)"; 

// ใช้ Buffer ของ Node.js ซึ่งทำงานได้เร็วกว่าหลักร้อยเท่าเมื่อเทียบกับลูปธรรมดา
function encodeHex(str) {
    return Buffer.from(str, 'utf8').toString('hex');
}

function protectPlaylistUrls(jsonObj) {
    if (jsonObj && jsonObj.groups) {
        jsonObj.groups.forEach(g => {
            if (g.stations) {
                g.stations.forEach(s => {
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play?data=")) {
                        // เข้ารหัสเฉพาะ URL ล้วนๆ (ไม่ต้องมี |||เวลาหมดอายุ)
                        const payload = s.url; 
                        s.url = `${BASE_ORIGIN}/play?data=${encodeHex(payload)}`;
                    }
                });
            }
        });
    }
    return jsonObj;
}

try {
    console.log("⏳ กำลังอ่านไฟล์ raw_filmhub.json...");
    const rawData = fs.readFileSync('raw_filmhub.json', 'utf8');
    const parsedData = JSON.parse(rawData);

    console.log("🔒 กำลังเข้ารหัสลิ้งก์...");
    const protectedData = protectPlaylistUrls(parsedData);

    console.log("💾 กำลังบันทึกไฟล์ filmhub.json...");
    fs.writeFileSync('filmhub.json', JSON.stringify(protectedData));
    
    console.log("✅ เสร็จสิ้น! ไฟล์พร้อมใช้งานแล้ว");
} catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.message);
    process.exit(1); // แจ้ง GitHub ให้รู้ว่าพัง
}
