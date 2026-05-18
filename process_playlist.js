const fs = require('fs');

// 🔴 โดเมนด่านหน้าของคุณ
const BASE_ORIGIN = "https://ikuyikuysas.dufreeapi.uk"; 

// 🌟 ฟังก์ชันเข้ารหัส Base64 (คืนค่ารูปแบบดั้งเดิมที่พิสูจน์แล้วว่าทำงานได้ 100%)
function encodeBase64Proxy(str) {
    const expiryDate = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);
    const jsonPayload = JSON.stringify({ u: str, e: expiryDate });
    return Buffer.from(encodeURIComponent(jsonPayload)).toString('base64');
}

function protectPlaylistUrls(jsonObj) {
    
    // 🚀 ถอนรากถอนโคนคำสั่ง Native Player จากระดับหน้าแรก (Root)
    if (jsonObj.hasOwnProperty('playInNatPlayer')) {
        delete jsonObj.playInNatPlayer;
    }

    function processGroups(groups) {
        if (!Array.isArray(groups)) return;
        groups.forEach(g => {
            
            // 🚀 ถอนรากถอนโคนคำสั่ง Native Player จากระดับโฟลเดอร์ (Group)
            if (g.hasOwnProperty('playInNatPlayer')) {
                delete g.playInNatPlayer;
            }

            if (g.stations && Array.isArray(g.stations)) {
                g.stations.forEach(s => {
                    
                    // 🚀 ถอนรากถอนโคนคำสั่ง Native Player จากระดับตัวหนัง (Station)
                    // บังคับให้ Wiseplay ใช้ ExoPlayer เสมอ เพื่อแก้ปัญหาค้างตอนเจอลิ้งก์ Proxy Redirect
                    if (s.hasOwnProperty('playInNatPlayer')) {
                        delete s.playInNatPlayer;
                    }
                    
                    // ⚠️ ห้ามลบ referer / userAgent / headers เด็ดขาด! เซิร์ฟเวอร์หนังจำเป็นต้องใช้ยืนยันตัวตน

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

        console.log(`🔒 กำลังประมวลผลลิ้งก์และปรับแต่งเครื่องเล่นสำหรับ ${inputFile}...`);
        const protectedData = protectPlaylistUrls(parsedData);

        console.log(`💾 กำลังบันทึกไฟล์ ${outputFile}...`);
        fs.writeFileSync(outputFile, JSON.stringify(protectedData));
        console.log(`✅ ประมวลผล ${outputFile} สำเร็จ!`);
    } else {
        console.log(`⚠️ ไม่พบไฟล์ ${inputFile} ข้ามการทำงาน`);
    }
}

try {
    processFile('raw_filmhub.json', 'filmhub1.json');
    processFile('raw_serieshub.json', 'serieshub1.json');
    console.log("🎉 เสร็จสิ้นทั้งหมด!");
} catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error.message);
    process.exit(1);
}
