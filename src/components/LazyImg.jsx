// piccolo componente per lazy load con IO + fallback
const LazyImg = React.memo(function LazyImg({ id, name, fallbackSrc }) {
    const ref = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    // costruisci CDN src/srcset
    const cdnDefault = `https://lh3.googleusercontent.com/d/${id}=w640`;
    const cdnSet = [320, 480, 768, 1024, 1600].map((w) => `https://lh3.googleusercontent.com/d/${id}=w${w} ${w}w`).join(", ");

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const img = el.querySelector("img");
                if (img && !img.getAttribute("src")) {
                    img.setAttribute("src", cdnDefault);
                    img.setAttribute("srcset", cdnSet);
                    img.setAttribute("sizes", "(max-width:768px) 33vw, 20vw");
                }
                obs.disconnect();
            }
        }, { root: null, rootMargin: "200px", threshold: 0.01 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [cdnDefault, cdnSet]);

    return (
        <Item ref={ref} onClick={() => setLoaded(true)}>
            <img
                alt={name || "gallery"}
                decoding="async"
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", background: "#111" }}
                onError={(e) => {
                    if (!errored) {
                        setErrored(true);
                        // fallback API
                        e.currentTarget.removeAttribute("srcset");
                        e.currentTarget.removeAttribute("sizes");
                        e.currentTarget.src = fallbackSrc;
                    } else {
                        // nascondi se proprio non caricabile
                        (e.currentTarget.parentElement).style.display = "none";
                    }
                }}
            />
        </Item>
    );
});
