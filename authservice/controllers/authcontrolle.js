
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { publishEvent } = require('../message/producer');

// --- REGISTER MANTIĞI ---
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kullanıcı var mı kontrol et
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu e-posta veya kullanıcı adı zaten kayıtlı' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Yeni kullanıcı oluştur
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Diğer servislere yeni kullanıcı oluşturulduğunu haber ver
        publishEvent('USER_CREATED', { userId: user._id, username: user.username });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu', userId: user._id });
    } catch (err) {
        res.status(500).json({ error: 'Kayıt işlemi başarısız', details: err.message });
    }
};

// --- LOGIN MANTIĞI ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Geçersiz e-posta veya şifre" });
};

// --- UPDATE MANTIĞI ---
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        
        // MÜHENDİSLİK: Diğer servislere kullanıcı bilgilerinin değiştiğini haber ver
        publishEvent('USER_UPDATED', { userId: id, username: updatedUser.username });

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ error: "Güncelleme başarısız" });
    }
};

// --- DELETE MANTIĞI ---
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);

        publishEvent('USER_DELETED', { userId: id });

        res.json({ message: "Kullanıcı başarıyla silindi" });
    } catch (err) {
        res.status(400).json({ error: "Silme işlemi başarısız" });
    }
};