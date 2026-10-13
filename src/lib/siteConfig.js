// Informações de contato da loja — edite aqui para atualizar todo o site.
export const siteConfig = {
  whatsapp: {
    number: "5511984790007", // formato internacional, só dígitos
    display: "+55 (11) 98479-0007",
    message: "Olá! Vim pelo site da Cadu Motors e gostaria de informações sobre os veículos.",
  },
  address: {
    label: "Alphaville",
    street: "Alameda Grajaú",
    number: "614",
    neighborhood: "Alphaville",
    city: "Barueri",
    state: "SP",
    zip: "",
    note: "",
  },
  instagram: {
    handle: "@cadu.motors",
    url: "https://www.instagram.com/cadu.motors/",
  },
  facebook: {
    handle: "Cadu Motors",
    url: "https://www.facebook.com/profile.php?id=61557971229548",
  },
};

export function waLink(message) {
  const text = encodeURIComponent(message || siteConfig.whatsapp.message);
  return `https://wa.me/${siteConfig.whatsapp.number}?text=${text}`;
}

export function fullAddress() {
  const a = siteConfig.address;
  let s = a.street || "";
  if (a.number) s += ", " + a.number;
  if (a.neighborhood) s += " - " + a.neighborhood;
  return s.trim();
}

export function mapsLink() {
  const a = siteConfig.address;
  const q = encodeURIComponent([a.street, a.number, a.neighborhood, a.city, a.state].filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
