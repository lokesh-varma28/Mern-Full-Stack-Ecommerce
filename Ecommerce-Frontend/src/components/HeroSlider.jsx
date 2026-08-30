import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./HeroSlider.css";

const BANNERS = [
    {
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=85",
        title: "Watches & Accessories",
        subtitle: "Up to 60% off on top brands",
        cta: "Shop Now",
        link: "/?category=Accessories",
    },
    {
        image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600&q=85",
        title: "Fashion Week Deals",
        subtitle: "New arrivals every day",
        cta: "Explore Fashion",
        link: "/?category=Fashion",
    },
    {
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=85",
        title: "Electronics & Gadgets",
        subtitle: "Best prices guaranteed",
        cta: "View Deals",
        link: "/?category=Electronics",
    },
    {
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&q=85",
        title: "Laptops & Computers",
        subtitle: "Power your productivity",
        cta: "Shop Laptops",
        link: "/?category=Laptops",
    },
];

export default function HeroSlider() {
    return (
        <div className="hero-slider-wrap">
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation
                loop
                className="hero-swiper"
            >
                {BANNERS.map((banner, i) => (
                    <SwiperSlide key={i}>
                        <a href={banner.link} className="hero-slide">
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="hero-img"
                                loading={i === 0 ? "eager" : "lazy"}
                            />
                            {/* Gradient overlay + text */}
                            <div className="hero-overlay">
                                <div className="hero-text">
                                    <h2 className="hero-heading">{banner.title}</h2>
                                    <p className="hero-sub">{banner.subtitle}</p>
                                    <span className="hero-cta">{banner.cta}</span>
                                </div>
                            </div>
                        </a>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
