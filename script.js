document.addEventListener("DOMContentLoaded", () => {
    const categoryButtons = document.querySelectorAll(".categories li");
    const gameCards = document.querySelectorAll(".game-card");

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove("active"));
            // Add active class to the clicked button
            button.classList.add("active");

            const category = button.getAttribute("data-category");

            // Show/hide game cards based on category
            gameCards.forEach(card => {
                const cardCategories = card.getAttribute("data-category");
                if (category === "all" || cardCategories.includes(category)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
});