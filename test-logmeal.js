import fs from 'fs';

async function run() {
    const token = 'a41520167a43f215aa1e75f471236ab939709688';

    const base64Image = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/2wBDAQcHBw0MDRgQEBgYDxAOGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCgABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABQf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwBlzP/Z";

    // Mimic the backend function
    const buffer = Buffer.from(base64Image, 'base64');
    const mediaType = 'image/jpeg';
    const createFormData = () => {
        const fd = new FormData();
        fd.append('image', new Blob([buffer], { type: mediaType }), 'image.jpg');
        return fd;
    };

    let currentToken = global._nourisLogMealToken || token;

    try {
        let segRes = await fetch(`https://api.logmeal.com/v2/image/segmentation/complete?language=eng`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
            body: createFormData(),
        });

        if (!segRes.ok && (segRes.status === 401 || segRes.status === 400)) {
            const errText = await segRes.text();
            try {
                const errJson = JSON.parse(errText);
                if (errJson.code === 802 || errJson.message?.includes('User not allowed')) {
                    console.log("APICompany token detected. Generating ephemeral APIUser token...");
                    const signUpRes = await fetch(`https://api.logmeal.com/v2/users/signUp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ username: `nouris_user_${Date.now()}_${Math.floor(Math.random() * 10000)}` })
                    });

                    if (signUpRes.ok) {
                        const signUpJson = await signUpRes.json();
                        currentToken = signUpJson.token;
                        global._nourisLogMealToken = currentToken; // Cache it globally
                        console.log("Successfully generated APIUser token.");

                        // Retry the original request WITH A NEW form data instance!
                        segRes = await fetch(`https://api.logmeal.com/v2/image/segmentation/complete?language=eng`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${currentToken}`,
                            },
                            body: createFormData(),
                        });
                    }
                } else {
                    segRes = { ok: false, status: segRes.status, text: async () => errText };
                }
            } catch (e) {
                segRes = { ok: false, status: segRes.status, text: async () => errText };
            }
        }

        if (!segRes.ok) {
            console.log("Segmentation failed:", await segRes.text());
            return;
        }

        const segmentation = await segRes.json();
        console.log("Segmentation Success:", segmentation);

        const imageId = segmentation.imageId;
        console.log("ImageId:", imageId);

        const nutRes = await fetch(`https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo?language=eng`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({ imageId }),
        });

        if (!nutRes.ok) {
            console.log("Nutrition failed:", await nutRes.text());
            return;
        }

        console.log("Nutrition Success:", await nutRes.json());
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
