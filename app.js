require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { S3Client, GetObjectCommand, PutObjectCommand} = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');
const {randomUUID} = require('crypto');

const app = express();
const port = 3000;

const s3 = new S3Client({ region: process.env.AWS_REGION});
const BUCKET = process.env.S3_BUCKET;

const upload = multer({ storage: multer.memoryStorage()});

const posts = [];

app.use(express.static("public"));

app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "image is required" });
        }

        if (!req.body.description?.trim()) {
            return res.status(400).json({ error: "description is required" });
        }

        const unique = randomUUID() + '-' + req.file.originalname;
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: unique,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            })
        );

        posts.unshift({unique, description: req.body.description.trim() });
        res.status(201).json({message: "Upload ok"});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
});

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`)
});
