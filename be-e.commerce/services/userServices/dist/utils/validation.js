"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = void 0;
const registerValidation = async (data) => {
    const errors = [];
    if (!data.name || data.name.trim() === "") {
        errors.push("Name is required");
    }
    if (data.name && data.name.length < 6) {
        errors.push("Name must be at least 6 characters long");
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (data.email && !emailRegex.test(data.email)) {
        errors.push("Invalid email format");
    }
    if (!data.password) {
        errors.push("Password is required");
    }
    if (data.password && data.password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.registerValidation = registerValidation;
const loginValidation = async (data) => {
    const errors = [];
    if (!data.email) {
        errors.push("Email is required");
    }
    if (!data.password) {
        errors.push("Password is required");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.loginValidation = loginValidation;
