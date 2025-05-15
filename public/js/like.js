// Function to check if a product is liked
async function checkLikeStatus(productId) {
    try {
        const response = await fetch('/get-liked-products');
        const likedProducts = await response.json();
        const isLiked = likedProducts.some(product => product._id === productId);
        
        // Update heart icon
        const heartIcon = document.querySelector(`[data-product-id="${productId}"]`);
        if (heartIcon) {
            heartIcon.className = isLiked 
                ? 'ri-heart-fill text-2xl cursor-pointer text-red-500 transition-colors'
                : 'ri-heart-line text-2xl cursor-pointer hover:text-red-500 transition-colors';
        }
        
        return isLiked;
    } catch (error) {
        console.error('Error checking like status:', error);
        return false;
    }
}

// Function to toggle like status
async function toggleLike(productId) {
    try {
        const response = await fetch('/toggle-like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        
        if (data.success) {
            // Update heart icon
            const heartIcon = document.querySelector(`[data-product-id="${productId}"]`);
            if (heartIcon) {
                if (data.isLiked) {
                    heartIcon.className = 'ri-heart-fill text-2xl cursor-pointer text-red-500 transition-colors';
                } else {
                    heartIcon.className = 'ri-heart-line text-2xl cursor-pointer hover:text-red-500 transition-colors';
                }
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Check like status when page loads
document.addEventListener('DOMContentLoaded', () => {
    const heartIcons = document.querySelectorAll('[data-product-id]');
    heartIcons.forEach(icon => {
        const productId = icon.getAttribute('data-product-id');
        checkLikeStatus(productId);
    });
}); 