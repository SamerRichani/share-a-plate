# Wireframes

Low-fidelity wireframes of ShareAPlate's main screens. Boxes show layout and
content, not final styling. On phones, multi-column grids stack into one column
and the header links fold into a menu.

## How the screens connect

```text
                    ┌──────────────┐
                    │   Landing    │
                    └──────┬───────┘
              ┌────────────┴────────────┐
        ┌─────▼─────┐             ┌─────▼─────┐
        │  Sign in  │◀───────────▶│  Sign up  │
        └─────┬─────┘             └───────────┘
     ┌────────┼──────────────────────┐
     │ donor  │ recipient            │ administrator
┌────▼─────┐ ┌▼────────────┐   ┌─────▼──────┐
│ My offers│ │ Find food   │   │ Moderation │
└──┬────┬──┘ └──────┬──────┘   └────────────┘
   │    │    ┌──────▼──────┐
   │    │    │ Offer detail│──▶ Reserve ──▶ pickup code
   │    │    └─────────────┘                   │
   │    │                            ┌─────────▼────────┐
   │    │                            │ My reservations  │
   │    │                            └──────────────────┘
┌──▼──┐ ┌▼──────────────────┐
│Offer│ │ Offer reservations│ ◀── donor enters recipient's code
│form │ └───────────────────┘
└─────┘
```

## 1. Landing page (`/`)

```text
┌──────────────────────────────────────────────────────────────┐
│ ShareAPlate      How it works  Food partners  Neighbors  [Sign in] │
├──────────────────────────────────────────────────────────────┤
│  GOOD FOOD. GOOD NEIGHBORS.                                  │
│  A little good goes a long way.               ┌───────────┐  │
│  Short explanation of the idea…               │  image    │  │
│  [Find food nearby]  [I have food to share]   └───────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Sharing is simple.                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │01 Share  │  │02 Find   │  │03 Pick up│                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
├──────────────────────────────────────────────────────────────┤
│  ┌ FOR FOOD PARTNERS ─────┐  ┌ FOR NEIGHBORS ─────────┐      │
│  │ Make your extra count. │  │ Find a little good…    │      │
│  └────────────────────────┘  └────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

## 2. Sign in (`/login`) and Sign up (`/register`)

```text
┌──────────────────────────────────────────────┐
│  WELCOME BACK                                │
│  Good to see you.                            │
│                                              │
│  Email     [______________________]          │
│  Password  [______________________]          │
│  ( error message shown here )                │
│            [        Sign in        ]         │
│                                              │
│  New around here? Create an account          │
└──────────────────────────────────────────────┘
Sign up adds: Name · Role (Donor / Recipient) · password ≥ 12 characters
```

## 3. Find food — recipient (`/offers`)

```text
┌──────────────────────────────────────────────────────────────┐
│ ShareAPlate   Find food  My reservations           [Sign out]│
├──────────────────────────────────────────────────────────────┤
│  Find your next pickup                                       │
│  Area [▼ any]   Food type [▼ any]   Pickup by [time]  [Show offers] │
├──────────────────────────────────────────────────────────────┤
│  Available offers                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Title        │  │ Title        │  │ Title        │        │
│  │ food type    │  │ food type    │  │ food type    │        │
│  │ Area: …      │  │ Area: …      │  │ Area: …      │        │
│  │ Pickup by …  │  │ Pickup by …  │  │ Pickup by …  │        │
│  │ 3 portions   │  │ 1 portion    │  │ 5 portions   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

## 4. Offer detail + reserve (`/offers/:id`)

```text
┌──────────────────────────────────────────────────────────────┐
│  Offer title                                                 │
│  Description…                                                │
│  Area | Pickup location | Pickup window | Portions left      │
├───────────────────────────────┬──────────────────────────────┤
│  Reserve portions             │  After reserving:            │
│  Portions [ 1 ▲▼ ]            │  Reservation confirmed       │
│  [   Make it yours   ]        │  Pickup code:  A7K2QX        │
├───────────────────────────────┴──────────────────────────────┤
│  Report this offer:  Reason [________________]  [Report]     │
└──────────────────────────────────────────────────────────────┘
```

## 5. My reservations — recipient (`/my-reservations`)

```text
┌──────────────────────────────────────────────────────────────┐
│  Reserved portions                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Offer title                         status: reserved   │  │
│  │ Quantity · Pickup location · Pickup window             │  │
│  │ Show this code at pickup:  A7K2QX          [Cancel]    │  │
│  └────────────────────────────────────────────────────────┘  │
│  (empty state: "Find food nearby" button)                    │
└──────────────────────────────────────────────────────────────┘
```

## 6. My offers + offer form — donor (`/my-offers`, `/my-offers/new`)

```text
┌──────────────────────────────────────────────────────────────┐
│  My offers                                [Create an offer]  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Title · status · portions left / total                 │  │
│  │ [Reservations] [Edit] [Close] [Remove]                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  Create / edit offer                         │
│  Title        [______________________]       │
│  Description  [______________________]       │
│  Food type    [▼ prepared meal …    ]        │
│  Portions     [___]   Area [__________]      │
│  Pickup location [___________________]       │
│  Pickup from [date/time]  to [date/time]     │
│              [   Save offer   ]              │
└──────────────────────────────────────────────┘
```

## 7. Offer reservations — donor (`/offers/:id/reservations`)

```text
┌──────────────────────────────────────────────────────────────┐
│  Offer title — Collection · Pickup window                    │
│  ┌──────────────┬──────────┬──────────┬────────────────────┐ │
│  │ Recipient    │ Portions │ Status   │ Confirm pickup     │ │
│  ├──────────────┼──────────┼──────────┼────────────────────┤ │
│  │ Name         │ 2        │ reserved │ Code [______] [OK] │ │
│  └──────────────┴──────────┴──────────┴────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 8. Moderation — administrator (`/admin`)

```text
┌──────────────────────────────────────────────────────────────┐
│  Review queue                       Status [▼ open]          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Offer title                                            │  │
│  │ Reported by account #12 · reason…                      │  │
│  │ [Resolve] [Dismiss]   [Close offer] [Remove offer]     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```
