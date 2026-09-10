import Image from "next/image";
import { ArrowIcon } from "@/components/icons";

const services = [
  { id: "training", title: "Agricultural training", copy: "Practical programmes shaped around productive growing.", link: "View training programmes", image: "/images/farm/training.jpg" },
  { id: "greenhouse", title: "Greenhouse construction", copy: "Structures planned for dependable, productive growing.", link: "Explore greenhouse services", image: "/images/farm/greenhouse.jpg" },
  { id: "consulting", title: "Agricultural consulting", copy: "Practical guidance for farms and agricultural projects.", link: "Explore consulting", image: "/images/farm/consulting.jpg" },
];

export function FarmStory() {
  return (
    <section className="farm-story" id="farm">
      <div className="farm-story-copy"><p className="eyebrow">ZADOK FARM · OMUDIOGA</p><h2>Grown here. Supplied directly.</h2><p>Produce is listed according to current farm availability.</p><a href="#about">Visit our farm <ArrowIcon /></a></div>
      <div className="farm-story-image"><Image src="/images/farm/fields.jpg" alt="Rows of crops growing at a farm" fill sizes="(max-width: 699px) 48vw, 42vw" /></div>
    </section>
  );
}

export function BeyondHarvest() {
  return (
    <section className="beyond-section" id="services">
      <h2>Beyond the harvest</h2>
      <div className="service-grid">
        {services.map((service) => (
          <article className="service-card" id={service.id} key={service.id}>
            <div className="service-image"><Image src={service.image} alt="" fill sizes="(max-width: 699px) 36vw, 33vw" /></div>
            <div><h3>{service.title}</h3><p>{service.copy}</p><a href={`#${service.id}`}>{service.link} <ArrowIcon /></a></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BulkSupply() {
  return (
    <section className="bulk-supply"><div><h2>Buying in volume?</h2><p>Tell us what you need, the approximate quantity and how often.</p></div><a href="#contact">Request bulk supply</a></section>
  );
}

const steps = [
  { title: "Requested quantity confirmed", copy: "We’ll confirm quantity and fulfilment through WhatsApp." },
  { title: "Delivery or pickup arranged", copy: "After submission, we’ll arrange delivery or pickup." },
  { title: "Order reference created immediately", copy: "You’ll receive a reference as soon as you submit your request." },
];

export function OrderSteps() {
  return (
    <section className="order-steps" id="order-information"><h2>How orders work</h2><ol>{steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div></li>)}</ol></section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer"><div><a className="footer-mark" href="#top">ZADOK FARMS</a><p>A ZADOK FOUNDATION INITIATIVE</p><small>© 2026 ZADOK FARMS.</small></div><nav aria-label="Footer navigation"><a href="#produce">Shop</a><a href="#training">Training</a><a href="#services">Services</a><a href="#farm">Our farm</a><a href="#about">About</a><a href="#order-information">Order information</a><a href="#faq">FAQs</a><a href="#contact">Contact</a></nav><div className="legal"><a href="#privacy">Privacy</a><span>|</span><a href="#terms">Terms</a></div></footer>
  );
}
