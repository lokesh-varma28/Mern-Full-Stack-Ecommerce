import { useNavigate } from "react-router-dom";
import "./Categories.css";

const CATEGORIES = [
    { title: "Mobiles",     image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80",  query: "Mobiles"     },
    { title: "Laptops",     image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80",  query: "Laptops"     },
    { title: "Fashion",     image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&q=80",  query: "Fashion"     },
    { title: "Electronics", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&q=80",     query: "Electronics" },
    { title: "Books",       image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&q=80",  query: "Books"       },
    { title: "Home & Kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80", query: "Home"        },
    { title: "Sports",      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&q=80",  query: "Sports"      },
    { title: "Beauty",      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80",  query: "Beauty"      },
];

export default function Categories() {
    const navigate = useNavigate();

    const handleClick = (query) => {
        navigate(`/?category=${encodeURIComponent(query)}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <section className="cats-section" aria-label="Shop by category">
            <div className="cats-inner">
                <h2 className="cats-title">Shop by Category</h2>
                <div className="cats-grid">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.title}
                            className="cat-card"
                            onClick={() => handleClick(cat.query)}
                            aria-label={`Browse ${cat.title}`}
                        >
                            <div className="cat-img-wrap">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="cat-img"
                                    loading="lazy"
                                />
                            </div>
                            <p className="cat-label">{cat.title}</p>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
