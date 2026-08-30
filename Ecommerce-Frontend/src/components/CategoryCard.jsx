/* CategoryCard is now rendered inline inside Categories.jsx.
   This file is kept as a named export in case it is used elsewhere. */

export default function CategoryCard({ image, title, onClick }) {
    return (
        <button
            className="cat-card"
            onClick={onClick}
            aria-label={`Browse ${title}`}
        >
            <div className="cat-img-wrap">
                <img
                    src={image}
                    alt={title}
                    className="cat-img"
                    loading="lazy"
                />
            </div>
            <p className="cat-label">{title}</p>
        </button>
    );
}
