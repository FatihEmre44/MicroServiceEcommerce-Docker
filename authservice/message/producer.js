const amqp = require('amqplib');

let channel;

// Retry ile bağlantı fonksiyonu
async function connectRabbit(retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
            channel = await connection.createChannel();
            console.log(' RabbitMQ bağlantısı başarılı');
            return; // Başarılı
        } catch (err) {
            console.log(`RabbitMQ bağlantı denemesi ${i + 1}/${retries} başarısız. ${delay/1000}s sonra tekrar...`);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));// 3 saniye bekle ve tekrar dene
            }
        }
    }
    console.error('RabbitMQ bağlantısı kurulamadı! Tüm denemeler başarısız.');
}

// Genel bir publish fonksiyonu
const publishEvent = (queueName, data) => {
    if (!channel) return console.error("RabbitMQ hazır değil!");
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
};

module.exports = { connectRabbit, publishEvent };