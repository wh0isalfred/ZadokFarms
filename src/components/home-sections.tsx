import Image from "next/image";
import { ArrowIcon } from "@/components/icons";

function FieldLines({ className = "" }: { className?: string }) {
  return (
    <svg className={`field-lines ${className}`} viewBox="0 0 420 320" fill="none" aria-hidden="true">
      <path d="M438 4C320 36 330 112 238 137C135 165 129 236 95 336" />
      <path d="M447 35C348 61 359 133 260 162C170 188 157 254 127 340" />
      <path d="M455 68C376 91 382 153 286 185C207 211 190 270 164 341" />
      <path d="M465 102C406 121 407 176 315 207C247 230 224 282 203 341" />
    </svg>
  );
}

export function FarmStory() {
  return (
    <aside className="farm-story" id="farm" data-reveal>
      <div className="farm-story-image"><Image src="/images/farm/fields-v2.webp" alt="Cultivated crop rows at Zadok Farms in Omudioga" fill sizes="(max-width: 699px) 100vw, 55vw" /></div>
      <div className="farm-story-copy"><p className="eyebrow">ZADOK FARM · OMUDIOGA</p><h2>Grown here. Supplied directly.</h2><p>Produce is listed according to current farm availability.</p><a href="#about">Visit our farm <ArrowIcon /></a></div>
    </aside>
  );
}

export function FarmServices() {
  return (
    <section className="farm-services" id="services">
      <FieldLines className="services-lines" />
      <header className="services-heading"><p className="eyebrow">TRAINING &amp; FARM SERVICES</p><h2>Learn. Build. Grow with Zadok.</h2><p>Practical agricultural knowledge and project support for real impact.</p></header>
      <div className="service-grid">
        <article className="training-card" id="training" data-reveal>
          <div className="service-image training-image"><Image src="/images/farm/training-v2.webp" alt="A practical agricultural training session in the field" fill sizes="(max-width: 699px) 100vw, 22vw" /></div>
          <div className="training-copy"><div className="programme-meta"><span>FIELD TRAINING</span><span>PROGRAMME DETAILS COMING SOON</span></div><h3>Agricultural training</h3><p>Practical programmes for aspiring farmers, teams and communities.</p><a className="primary-service-action" href="#training-programmes">View training programmes <ArrowIcon /></a></div>
        </article>
        <article className="service-card greenhouse-card" id="greenhouse" data-reveal>
          <div className="service-image"><Image src="/images/farm/greenhouse.jpg" alt="A greenhouse built for productive growing" fill sizes="(max-width: 699px) 100vw, 25vw" /></div>
          <div className="service-copy"><h3>Greenhouse construction</h3><p>Planning and building productive growing environments.</p><a href="#greenhouse-services">Discuss a greenhouse project <ArrowIcon /></a></div>
        </article>
        <article className="service-card consulting-card" id="consulting" data-reveal>
          <div className="service-image"><Image src="/images/farm/consulting-v2.webp" alt="A farm consultant reviewing crops with a grower" fill sizes="(max-width: 699px) 100vw, 25vw" /></div>
          <div className="service-copy"><h3>Agricultural consulting</h3><p>Practical support for farm setup, crop planning and operations.</p><a href="#consulting-services">Request farm guidance <ArrowIcon /></a></div>
        </article>
      </div>
    </section>
  );
}

export function BulkSupply() {
  return <section className="bulk-supply" data-reveal><div className="bulk-symbol"><Image src="/images/products/seedlings.jpg" alt="" fill sizes="68px" /></div><div className="bulk-copy"><h2>Buying in volume?</h2><p>We supply larger quantities for individuals, businesses and organisations. Tell us what you need and how often.</p></div><a href="#contact">Request bulk supply <ArrowIcon /></a></section>;
}

const steps = [
  { title: "Prepare your basket", copy: "Add the produce and quantities you would like to request." },
  { title: "We confirm today’s availability", copy: "Our team checks current farm stock and gets back to you." },
  { title: "Arrange delivery or pickup", copy: "We coordinate delivery to your location or pickup from the farm." },
];

export function OrderSteps() {
  return <section className="order-steps" id="order-information"><h2>How orders work</h2><ol>{steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></li>)}</ol></section>;
}

export function FarmClose() {
  return (
    <section className="farm-close" id="about" data-reveal>
      <FieldLines className="closing-lines" />
      <div className="farm-close-image"><Image src="/images/farm/fields-v2.webp" alt="Zadok Farms fields and growing facilities" fill sizes="(max-width: 699px) 100vw, 50vw" /></div>
      <div><h2>Grounded in the work.</h2><p>Zadok Farms operates from Omudioga, connecting fresh produce, practical training and agricultural services for stronger, more resilient food systems.</p><a href="#farm">About Zadok Farms <ArrowIcon /></a></div>
    </section>
  );
}

export function SiteFooter() {
  return <footer className="site-footer" id="footer"><a className="footer-mark" href="#top">ZADOK FARMS</a><nav aria-label="Footer navigation"><a href="#produce">Shop</a><a href="#training">Training</a><a href="#services">Services</a><a href="#farm">Our farm</a><a href="#about">About</a></nav><div className="footer-social" aria-label="Social links"><a href="#facebook" aria-label="Facebook">f</a><a href="#instagram" aria-label="Instagram">◎</a><a href="#youtube" aria-label="YouTube">▶</a></div><p>Good food.<br />Stronger tomorrows.</p></footer>;
}
