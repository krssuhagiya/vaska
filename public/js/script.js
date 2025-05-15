document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Slideshow Functionality
    const slideshow = document.getElementById("slideshow");
    if (!slideshow) throw new Error("Slideshow element not found!");

    const slides = slideshow.children;
    const totalSlides = slides.length;
    let index = 0;

    function showSlide(i) {
      if (totalSlides === 0) {
        console.warn("No slides available!");
        return;
      }
      index = (i + totalSlides) % totalSlides;
      slideshow.style.transform = `translateX(-${index * 100}%)`;
    }

    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");

    if (prevButton && nextButton) {
      prevButton.addEventListener("click", () => showSlide(index - 1));
      nextButton.addEventListener("click", () => showSlide(index + 1));
    } else {
      console.warn("Slideshow navigation buttons not found!");
    }

    // Make "Shop Now" buttons functional in slideshow
    const shopNowButtons = document.querySelectorAll('#slideshow a');
    if (shopNowButtons.length > 0) {
      shopNowButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          // Redirect to products page
          window.location.href = '/men'; // You can change this to any products page
        });
      });
    }

    setInterval(() => showSlide(index + 1), 6000);

    // Category List Functionality
    const categoryList = document.getElementById("categoryLink");
    const categoryContainer = document.getElementById("categories");
    const icon = categoryContainer
      ? categoryContainer.querySelector("i")
      : null;

    if (!categoryList || !categoryContainer || !icon) {
      throw new Error("Category elements missing in DOM!");
    }

    // Keep track of whether categories are loaded
    let categoriesLoaded = false;

    async function fetchCategories() {
      // Only fetch if not loaded yet
      if (!categoriesLoaded) {
        try {
          const response = await fetch("/get-categories");
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid category data format!");
          }

          // Populate categories
          categoryList.innerHTML = "";
          data.forEach((cat) => {
            if (!cat._id || !cat.categoryName) {
              console.warn("Skipping invalid category data:", cat);
              return;
            }
            const _categoryLink = document.createElement("a");
            _categoryLink.href = `/category/${cat._id}`;
            _categoryLink.classList.add(
              "border",
              "border-gray-300",
              "px-6",
              "py-2",
              "hover:bg-gray-100"
            );
            _categoryLink.textContent = cat.categoryName;
            categoryList.appendChild(_categoryLink);
          });
          
          categoriesLoaded = true;
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      }
    }

    // Fetch categories when the page loads
    await fetchCategories();

    // Fix: Store the state of the toggle
    let isCategoryOpen = true; // Default to open

    // Make the dropdown visible by default
    categoryList.style.maxHeight = categoryList.scrollHeight + "px";
    icon.style.transform = "rotate(180deg)";

    categoryContainer.addEventListener("click", function (event) {
      // Toggle category visibility
      if (isCategoryOpen) {
        categoryList.style.maxHeight = null;
        icon.style.transform = "rotate(0deg)";
      } else {
        categoryList.style.maxHeight = categoryList.scrollHeight + "px";
        icon.style.transform = "rotate(180deg)";
      }
      
      // Update the state
      isCategoryOpen = !isCategoryOpen;
      
      // Prevent the click from triggering a navigation
      event.preventDefault();
    });
  } catch (error) {
    console.error("Critical error in DOMContentLoaded:", error);
  }
});
