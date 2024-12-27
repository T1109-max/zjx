const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const app = express();

require('dotenv').config();

const API_KEY = process.env.ZHIPU_API_KEY; // 从环境变量获取API密钥
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

app.use(express.json());

// 生成JWT Token
function generateToken() {
    const [id, secret] = API_KEY.split('.');
    const now = Date.now();
    
    const payload = {
        api_key: id,
        exp: now + 3600 * 1000,
        timestamp: now
    };

    const header = {
        alg: 'HS256',
        sign_type: 'SIGN'
    };

    return jwt.sign(payload, secret, { 
        algorithm: 'HS256',
        header: header 
    });
}

// 处理聊天请求
app.post('/api/chat', async (req, res) => {
    try {
        const token = generateToken();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'glm-4',
                messages: req.body.messages
            })
        });

        if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({
            content: data.choices[0].message.content,
            role: data.choices[0].message.role
        });
    } catch (error) {
        console.error('Chat request failed:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 