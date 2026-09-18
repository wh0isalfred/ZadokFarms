const choices = [
  { value: "pickup", label: "Pickup", description: "I'd prefer to collect. Zadok will confirm arrangements." },
  { value: "delivery", label: "Delivery", description: "I'd prefer delivery. Zadok will confirm whether it can be arranged." },
  { value: "to_confirm", label: "I need guidance", description: "I'd like help deciding between pickup and delivery." },
] as const;

type Fulfilment = typeof choices[number]["value"];
export function FulfilmentChoices({ value, onChange }: { value: Fulfilment; onChange: (value: Fulfilment) => void }) {
  return (
    <fieldset className="fulfilment-choices">
      <legend>How would you like to receive your produce?</legend>
      {choices.map((choice) => (
        <label className="fulfilment-choice" key={choice.value}>
          <input type="radio" name="fulfilment" value={choice.value} required checked={value === choice.value} onChange={() => onChange(choice.value)} aria-labelledby={`fulfilment-${choice.value}-label`} aria-describedby={`fulfilment-${choice.value}-help`} />
          <span><strong id={`fulfilment-${choice.value}-label`}>{choice.label}</strong><span id={`fulfilment-${choice.value}-help`}>{choice.description}</span></span>
        </label>
      ))}
    </fieldset>
  );
}
