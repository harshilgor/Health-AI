import fs from 'fs';

async function run() {
    const token = 'a41520167a43f215aa1e75f471236ab939709688';

    const base64Image = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/2wBDAQcHBw0MDRgQEBgYDxAOGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCgABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABQf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwBlzP/Z";

    const buffer = Buffer.from(base64Image, 'base64');
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpg');

    try {
        let segRes = await fetch(`https://api.logmeal.com/v2/image/segmentation/complete?language=eng`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });
        console.log("Status 1:", segRes.status);
        console.log("Response 1:", await segRes.text());

        console.log("Retrying with SAME formData...");
        const signUpRes = await fetch(`https://api.logmeal.com/v2/users/signUp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ username: `test_formdata_${Date.now()}` })
        });
        const newToken = await (await signUpRes).json();

        const segRes2 = await fetch(`https://api.logmeal.com/v2/image/segmentation/complete?language=eng`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${newToken.token}`
            },
            body: formData
        });
        console.log("Status 2:", segRes2.status);
        console.log("Response 2:", await segRes2.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
