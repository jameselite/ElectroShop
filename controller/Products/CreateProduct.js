import prisma from "../../prismaclient.js";
import slugify from "slugify";

export const CreateProduct = async (req, res) => {
    try {

        if(!req.user.isadmin){
            return res.status(403).json({ error: "Access denied." });
        }
        
        const { name, description, price, quantity, picture, category_name } = req.body;

        if (!name || !price || !quantity || !description || !picture || !category_name ) {
            return res.status(400).json({ error: "All fields are required." });
        }

        if (typeof name !== "string" || typeof price !== "number" || typeof quantity !== "number" || typeof description !== "string" || typeof picture !== "string" || typeof category_name !== "string") {
            return res.status(400).json({ error: "The format of requested data is wrong." });
        }

        let codeSlug = slugify(name, { strict: true, lower: true });
        let count = 0;

        let productCode = `${codeSlug}-${count}`;
        let isCodeExist = await prisma.product.findUnique({ where: { code: productCode } });

        while (isCodeExist) {
            count++;
            productCode = `${codeSlug}-${count}`;
            isCodeExist = await prisma.product.findUnique({ where: { code: productCode } });
        }

        const now = new Date();

        const category = await prisma.category.findUnique({ where: {slug: category_name }});

        if(!category) return res.status(404).json({ error: "Category not found." });

        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: price,
                quantity: quantity,
                description: description,
                code: productCode,
                picture: picture,
                created_at: String(now),
                updated_at: String(now),
                categoryid: category.id
            },
            select: {
                name: true,
                description: true,
                price: true,
                code: true,
                picture: true,
                created_at: true,
                updated_at: true,
                category: {select: {name: true, slug: true, created_at: true, updated_at: true }}
            }
        });

        return res.status(201).json(newProduct);
    } catch (err) {
        return res.status(500).json({ error: err.message }); 
    }
}