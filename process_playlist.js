const fs = require('fs');

// 🔴 โดเมนด่านหน้าของคุณ
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// 🌟 ย่อ Base64 ให้สั้นที่สุด (ไม่ต้องมี JSON) และแปลงเป็น URL-Safe
function encodeBase64Proxy(str) {
    let b64 = Buffer.from(encodeURIComponent(str)).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function protectPlaylistUrls(jsonObj) {
    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    // 🚀 [จุดแตกหัก] ลบคำสั่งบังคับใช้ Native Player ออก!
                    // เพราะ Native Player ไม่รองรับลิ้งก์ Proxy Redirect
                    // ลบทิ้งเพื่อให้ Wiseplay ใช้เครื่องเล่นหลัก (ExoPlayer) ของตัวเองแทน
                    if (s.playInNatPlayer) {
                        delete s.playInNatPlayer;
                    }

                    // เข้ารหัสลิ้งก์เป็น Base64
                    if (s.url && s.url.startsWith("http") && !s.url.includes("/play.m3u8?t=")) {
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
