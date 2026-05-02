const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPoints(points: number) {
  if (points > 0) {
    return `+${moneyFormatter.format(points)}`;
  }

  return moneyFormatter.format(points);
}

export function formatBalance(points: number) {
  return moneyFormatter.format(points);
}

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}
