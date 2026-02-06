# 1. Hafif ve güvenli bir Node.js imajı seçiyoruz
FROM node:18-alpine

# 2. Konteyner içinde çalışma dizini oluşturuyoruz
WORKDIR /app

# 3. Önce bağımlılık dosyalarını kopyalıyoruz (Docker layer caching için kritik)
COPY package*.json ./

# 4. Sadece gerekli paketleri kuruyoruz
RUN npm install

# 5. Projenin geri kalan tüm dosyalarını kopyalıyoruz
COPY . .

# 6. Servisin çalıştığı portu dış dünyaya açıyoruz
EXPOSE 3001

# 7. Uygulamayı başlatıyoruz
CMD ["node", "index.js"]