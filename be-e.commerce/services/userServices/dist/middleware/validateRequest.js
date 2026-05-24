"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateRegister = void 0;
const validateRegister = async (c, next) => {
    try {
        const body = await c.req.json();
        const errors = [];
        if (!body.name || body.name.trim() === "") {
            errors.push("Name is required");
        }
        else if (body.name.length < 6) {
            errors.push("Name must be at least 6 characters long");
        }
        if (!body.email || body.email.trim() === "") {
            errors.push("Email is required");
        }
        else {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(body.email)) {
                errors.push("Invalid email format");
            }
        }
        if (!body.password) {
            errors.push("Password is required");
        }
        else if (body.password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        if (errors.length > 0) {
            return c.json({
                success: false,
                message: "Validation failed",
                errors,
            }, 400);
        }
        c.set("validatedData", body);
        await next();
    }
    catch (error) {
        return c.json({
            success: false,
            message: "Invalid request body",
        }, 400);
    }
};
exports.validateRegister = validateRegister;
const validateLogin = async (c, next) => {
    try {
        const body = await c.req.json();
        const errors = [];
        if (!body.email) {
            errors.push("Email is required");
        }
        if (!body.password) {
            errors.push("Password is required");
        }
        if (errors.length > 0) {
            return c.json({
                success: false,
                message: "Validation failed",
                errors,
            }, 400);
        }
        c.set("validatedData", body);
        await next();
    }
    catch (error) {
        return c.json({
            success: false,
            message: "Invalid request body",
        }, 400);
    }
};
exports.validateLogin = validateLogin;
