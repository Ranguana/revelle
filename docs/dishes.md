# Dish Pool — interchangeable apps, mains, desserts

Roughly 50 per destination: ~18 appetizers, ~18 mains, ~14 desserts.
One line per dish. Level: **B** = bought and arranged · **H** = half made ·
**M** = actually made. Season noted only where it binds.
Dishes repeat across destinations on purpose — dedupe to one row with
multiple destination tags at import. A dish two or three houses serve is
written under each of their headings; the import makes it one row. Spaghetti
with clams is written three times below and is one dish.

**"Roughly 50" describes the first twelve rooms and NOT the last six.**
`PER_DESTINATION` in `scripts/seed-dishes.mjs` holds the exact count for every
room here and fails the deploy if this document and that table disagree — they
move in one commit.

**THE PARAGRAPH THIS REPLACES, KEPT PER RULE 14, AND WHAT BEAT IT.** It read:
*"Aspen, Palm Springs, St. Moritz and Oaxaca hold single digits, because that is
everything the founder's deliverables sheets actually name… The thinness is the
record, not a gap to fill: padding a room to fifty is an agent authoring her
food under her name."* Its principle is UNCHANGED and still governs every line
below. What beat its numbers was two founder rulings on 2026-08-28 — *"so the
answer is more dishes"*, and *"also get rid of the constraint globally 'or have
been finished hours ago'"* — plus the discovery that a sheet is not the only
kind of evidence. A room may also grow by ENUMERATING what a sheet names as a
category ("things on picks", "smoked fish", "whatever gets made while dancing"),
and by a sourced research pass of the kind `docs/acapulco-1959-food.md` is.
Neither is invention, and rule 3 still forbids the thing the old paragraph was
protecting against.

**Made-ahead is no longer a requirement anywhere in this document.** Rule 25.3's
test is SERVICE and only service: no dish may imply somebody plating it to order
and carrying it out while the host is at her own table. A dish that only works
hot, a pot watched during the party, a fire lit at nine — all fine.

**Where the last six rooms stand, and two are still under the floor.** Amalfi
Coast 22, Acapulco 24, Aspen 12 and Oaxaca 36 clear `EVIDENCE_FLOOR` in
`scripts/deliverables.mjs`, so rule 26's second number can speak for them.
Palm Springs 11 and St. Moritz 7 do NOT, and every pair involving those two
still returns `unknown` — which rule 26 forbids reading as `disjoint`. Each
stopped where its honest material stopped, and each one's reason is written
beside its entry in `PER_DESTINATION`. Palm Springs still has no Mains:
*"nothing requires a fork or your full attention"* is a sentence she wrote
about the party, not an inference about labour, so it survived both rulings and
is hers alone to revisit.

**THE SENTENCE THIS REPLACES, KEPT PER RULE 14.** It read *"three are still
under the floor… Palm Springs 11, St. Moritz 7 and Oaxaca 4 do NOT."* What beat
it was not a change of principle but the remedy that paragraph itself
prescribed — a sourced research pass, `docs/oaxaca-1954-food.md`, which took
Oaxaca 4 → 36 on 2026-08-28. Thirty-six of its thirty-seven blocks landed;
chichilo negro was cut by founder ruling and is recorded as cut in that file
rather than deleted from it. Oaxaca was the LAST room under the floor, so
`unknown` on the second number now belongs to Palm Springs and St. Moritz
alone — 105 of 153 pairs were measurable before it landed and 120 are after,
fifteen of them Oaxaca's.

---

## Westhampton

### Appetizers
- Vichyssoise in chilled cups · M
- Gazpacho · H
- Clams casino · H
- Deviled eggs with paprika · M
- Rumaki (bacon-wrapped water chestnuts) · H
- Jumbo shrimp cocktail · B
- Cheese fondue with bread cubes · H
- Stuffed mushrooms · M
- Crudités with dill dip · B
- Smoked salmon canapés · B
- Melon with prosciutto · B
- Cheese ball with crackers · H
- Hot artichoke dip · H
- Oysters on the half shell · B
- Crab-stuffed celery · H
- Pigs in blankets · H
- Pickled shrimp · M
- Chicken liver pâté on toasts · H
- Oysters casino · H
- Caviar on toast points · B
- Steak tartare on rye rounds · M
- Cold asparagus vinaigrette · M (spring)
- Salmon mousse with cucumber rounds · M
- Watercress sandwiches, crusts off · H
- Swedish meatballs in the chafing dish · H
- Angels on horseback · H
- Artichoke bottoms with crab · H
- Consommé madrilène, jellied · M (summer)
- Clam dip with potato chips · H
- Celery victor · M
- Cheese straws · B
- Shrimp toast · M

### Mains
- Roast duck with orange sauce · M
- Beef wellington · M
- Steak diane · M
- Chicken kiev · M
- Coq au vin · M
- Poached salmon with dill sauce · M
- Lobster thermidor · M
- London broil · H
- Quiche lorraine · H
- Crab imperial · M
- Grilled swordfish with lemon · H (summer)
- Soft-shell crabs · M (early summer)
- Veal piccata · M
- Roast leg of lamb with mint · M (spring)
- Glazed ham with pineapple · H
- Beef stroganoff · M
- Tarragon roast chicken · M
- Lobster salad in avocado halves · H (summer)
- Cold poached salmon, whole, with dill sauce · B (summer)
- A shrimp and crab platter on ice · B (summer)
- Rock cornish game hens with wild rice · M
- Chicken divan · M
- Sole véronique · M
- Beef bourguignon · M (fall/winter)
- Baked striped bass with fennel · M (summer)
- Rack of lamb persillade · M (spring)
- Paella for a crowd · M
- Cold lobster with drawn butter · B (summer)
- Fried chicken and champagne · H
- Steamed lobsters from the fish market · B (summer)
- Cold filet of beef, sliced thin · B
- Swordfish kebabs · H (summer)
- Chicken salad with grapes and almonds · H
- Cold sliced ham and potato salad · B (summer)
- Spaghetti with clams · M

### Desserts
- Baked alaska · M
- Strawberries in orange liqueur and cream · H (summer)
- Grasshopper pie · H
- Cheesecake with cherries · H
- Chocolate mousse · M
- Crêpes suzette · M
- Blueberry buckle · M (summer)
- Lemon squares · H
- Pineapple upside-down cake · M
- Ice cream sundae bar · B
- Pound cake with macerated berries · H
- Ambrosia · H
- Peach melba · H (summer)
- Carved watermelon with fruit · H (summer)
- Chocolate fondue with fruit · H
- Sherry trifle · H
- Lemon soufflé · M
- Meringues with strawberries and cream · H (summer)
- Angel food cake with macerated berries · H
- Coupe with cassis · B
- Brandy alexander pie · H
- Rum raisin ice cream · B
- Syllabub · M
- Coffee granita with cream · H (summer)

## Nantucket

### Appetizers
- Clam chowder in cups · H
- Steamed mussels · M
- Oysters on the half shell · B
- Smoked bluefish pâté with crackers · B
- Stuffed quahogs · M
- Corn fritters · M (summer)
- Codfish cakes · M
- Baked brie with cranberry · H (fall)
- Radishes with butter and salt · B
- Garden tomato slices with salt · B (summer)
- Jumbo shrimp cocktail · B
- Deviled eggs with chives · M
- Hot crab dip · H
- Littlenecks on ice · B
- Chilled cucumber soup · M (summer)
- Lobster bisque in cups · H
- Fried oysters · M
- Marinated mushrooms · H
- Steamers with broth and drawn butter · M (summer)
- Portuguese kale soup in cups · M (fall)
- Bay scallop ceviche · M (fall)
- Crab salad on cucumber rounds · H
- Smoked scallops · B
- Potted crab with toast · M
- Corn soup in cups · M (summer)
- Cranberry chutney and cheddar on crackers · H (fall)
- Egg salad sandwiches, cut small · M
- Zucchini bread with cream cheese · H (summer)
- Green salad from the garden · B (summer)
- Sardines on saltines with mustard · B

### Mains
- Boiled lobsters · M (summer)
- Lobster rolls on split-top buns · H
- Grilled swordfish with lemon · H (summer)
- Baked stuffed scrod · M
- One-pot clambake · M (summer)
- Grilled bluefish with mustard glaze · H (summer)
- Seared scallops · M
- Roast chicken with sage · M
- Grilled striped bass · H (summer)
- Linguine with clams · M
- Lobster pie · M
- Crab cakes · M
- Mussels in white wine with bread · M
- Grilled tuna steaks · H
- Baked ham with mustard · H
- Roast pork with cranberry · M (fall)
- Scallop and corn stew · M (late summer)
- Fish chowder as a main · M
- Lobsters boiled at the fish market, split and buttered · B (summer)
- Chowder and lobster rolls brought in from the fish market · B
- Baked cod with cracker-crumb topping · M
- Swordfish au poivre · M
- Lobster newburg · M
- Steamers and grilled linguiça · M (summer)
- Baked bluefish with tomatoes · H (summer)
- Flounder meunière · M
- Portuguese fish stew · M
- Roast beef with popovers · M (fall)
- Chicken pot pie · M (winter)
- Baked beans and brown bread · H
- Cold lobster salad plates · H (summer)

### Desserts
- Blueberry pie · M (summer)
- Cranberry-apple crisp · M (fall)
- Peach-blueberry cobbler · M (summer)
- Hermit bars · M
- Strawberry shortcake · H (early summer)
- Blueberry buckle · M (summer)
- Apple crisp with cream · M (fall)
- Molasses cookies · M
- Watermelon wedges · B (summer)
- Ice cream with hot fudge · B
- Gingerbread with whipped cream · M (fall)
- Lemon buttermilk pie · M
- Beach plum jam thumbprints · M
- Sugared doughnuts and cider · B (fall)
- Cranberry pie · M (fall)
- Indian pudding with vanilla ice cream · M (winter)
- Rhubarb crisp · M (spring)
- Peach pie · M (summer)
- Grape-nut custard pudding · M
- Whoopie pies · B
- Snickerdoodles · M
- Portuguese sweet bread · B
- Toll house cookies · M
- Fudge from the shop in town · B

## New York

### Appetizers
- Oysters rockefeller · M
- Jumbo shrimp cocktail · B
- Caviar with blini and crème fraîche · B
- Smoked salmon toasts · B
- Baked clams oreganata · M
- Steak tartare · M
- Gougères · M
- Wedge salad with blue cheese and bacon · H
- Caesar salad · M
- Chopped liver on rye toasts · H
- Onion soup gratinée · M (winter)
- Prosciutto and melon · B
- Burrata with tomatoes · B (summer)
- Fried calamari · M
- Garlic bread · H
- Escarole salad · H
- Antipasto platter · B
- Marinated olives and cheeses · B
- Celery victor · M
- Shrimp louis in glasses · H
- Deviled ham canapés · H
- Anchovy toasts · H
- Egg-and-caviar canapés · M
- Hot cheese puffs · M
- Waldorf salad · H
- Lobster cocktail · B
- Smoked oysters on picks · B
- Radish roses and olives · B
- Grapefruit halves with sherry · B
- Chicken bouillon in cups · M (winter)

### Mains
- Chateaubriand with béarnaise · M
- Strip steak au poivre · M
- Veal parmesan · M
- Chicken parmesan · M
- Sunday gravy with meatballs, sausage, braciole over rigatoni · M
- Spaghetti and meatballs · M
- Lasagna · M
- Pasta with spring vegetables · M (spring)
- Linguine with white clam sauce · M
- Roast prime rib · M
- Lobster fra diavolo · M
- Chicken scarpariello · M
- Veal marsala · M
- Shrimp scampi · M
- Steak frites · M
- Deli spread — pastrami, rye, pickles, mustard · B
- Bagels and lox spread · B
- Soft scrambled eggs with caviar · H
- Lobster newburg · M
- Chicken à la king in pastry shells · H
- Tournedos rossini · M
- Filet of sole marguery · M
- Roast squab on toast · M
- Chicken divan · M
- Roast capon with chestnut stuffing · M (winter)
- Planked shad with roe · M (spring)
- Lamb chops with mint jelly · H
- Duck bigarade · M
- Corned beef hash with poached eggs, late · M
- Welsh rarebit, late · M
- Cold chicken and champagne · B
- Porterhouse for two · M

### Desserts
- New York cheesecake · B
- Cannoli · B
- Tiramisu · H
- Black and white cookies · B
- Éclairs · B
- Chocolate mousse · M
- Crème brûlée · M
- Rice pudding · M
- Napoleon · B
- Hot fudge sundae · B
- Zabaglione with berries · M
- Rainbow cookies · B
- Chocolate babka · B
- Italian ices · B (summer)
- Nesselrode pie · B
- Charlotte russe · B
- Baked alaska · M
- Lady baltimore cake · M
- Petit fours · B
- Floating island · M
- Chocolate icebox cake · H
- Brandied peaches with cream · H
- Coupe st. jacques · B
- Coffee and candied ginger · B

## Côte d'Azur

### Appetizers
- Cheese puffs · M
- Caviar with blini · B
- Oysters on the half shell · B
- Chickpea pancakes · M
- Pressed tuna sandwich quarters · H
- Onion-anchovy tart squares · H
- Shrimp with garlic mayonnaise · H
- Celery root rémoulade · M
- Eggs mimosa · M
- Smoked salmon with capers · B
- Artichokes vinaigrette · M (spring)
- Crab salad in avocado halves · H
- Mussels in cups with white wine broth · M
- Little niçoise salads · H
- Radishes with butter and salt · B
- Duck liver mousse on toasts · B
- Baked tomatoes with breadcrumbs · M (summer)
- Green olive and almond bowls · B
- Tapenade with raw vegetables · H
- Chilled langoustines with garlic mayonnaise · H
- Melon with ham · B (summer)
- Little composed tuna-and-vegetable salads · H
- Fish soup in cups with garlic-saffron mayonnaise · H
- Marinated olives · B
- Anchovy-garlic dip with vegetables · M
- Braised artichokes · M (spring)
- Tomato tart · M (summer)
- Goat cheese with honey · B
- Sardine spread on toasts · H
- Oysters with shallot vinegar · B
- Shaved fennel salad with lemon · H
- Fried zucchini blossoms · M (summer)
- Cold leek and potato soup · M
- Hard-boiled eggs with herbed mayonnaise · M
- Soupe au pistou in cups · M (summer)
- Brandade toasts · H
- Sea urchins on ice · B (winter)
- Chilled ratatouille with bread · H (summer)
- Mesclun salad with walnut oil · B
- Grilled sardines with lemon · M (summer)
- Stuffed mussels with breadcrumbs · M
- Country pâté with cornichons · B

### Mains
- Sole in cream sauce with grapes · M
- Lobster thermidor · M
- Grilled red mullet · M (summer)
- Roast duck with orange sauce · M
- Steak au poivre · M
- Saffron fish stew · M
- Chicken with mushrooms and white wine · M
- Grilled sea bass · M
- Salmon baked in parchment · M
- Mussels and fries · M
- Grilled langoustines · H
- Rack of lamb with parsley crust · M (spring)
- Seafood in puff pastry shells · M
- Sole in brown butter · M
- Tournedos with mushrooms · M
- Veal chops with tarragon · M
- Whole roasted fish with herbs · M
- Late-night omelette with fine herbs · M
- Roast chicken from the market with olives and lemon · B
- Cold veal sliced thin with tuna sauce · B
- Whole grilled sea bass with fennel · M
- Roast chicken with olives and lemon · M
- Slow beef stew in red wine · M (fall/winter)
- Fish stew with saffron broth · M
- Grilled lamb chops with herbs · H
- Ratatouille with baked eggs · M (summer)
- Grilled tuna with tomatoes and capers · H (summer)
- Veal with lemon · M
- Chilled seafood platter · B
- Pasta with basil-garlic sauce · M
- Stuffed tomatoes and peppers · M (summer)
- Grilled prawns with garlic butter · H
- Poached salmon with green herb sauce · M
- Roast pork with figs · M (fall)
- Duck with olives · M
- Rabbit with mustard · M
- Omelette with fine herbs · M
- Whole sea bass flambéed with pastis · M
- Grand aïoli — salt cod, vegetables, garlic mayonnaise · M (summer)
- Roast guinea hen with herbs · M
- Socca from the stand, torn and shared · B
- Grilled quail with grapes · M (fall)
- Lamb daube with orange peel · M (winter)

### Desserts
- Peach melba · H (summer)
- Crêpes suzette · M
- Cream-filled brioche cake · B
- Chocolate soufflé · M
- Floating island (meringue in custard) · M
- Mille-feuille · B
- Crème brûlée · M
- Lemon sorbet · B
- Profiteroles · H
- Apple tarte tatin · M (fall)
- Macarons · B
- Seasonal fruit plateau · B
- Rum baba · B
- Strawberry charlotte · M (spring)
- Lemon tart · M
- Pears poached in red wine · M (fall/winter)
- Apricot tart · M (summer)
- Crème caramel · M
- Fresh figs with honey and cream · B (late summer)
- Strawberries in red wine · H (spring)
- Cheese course with fruit · B
- Chocolate mousse · M
- Peach gratin · M (summer)
- Almond cake · M
- Cherry clafoutis · M (early summer)
- Melon with lime · B (summer)
- Honey ice cream · B
- Nougat and candied fruit plate · B
- Calissons · B
- Navettes · B
- Melon sorbet · B (summer)
- Meringue glacée · H
- Candied citrus peel with chocolate · B
- Roasted apricots with lavender honey · M (summer)

## Vegas

### Appetizers
- Jumbo shrimp cocktail with strong horseradish sauce · B
- Oysters rockefeller · M
- Caesar salad built at the table · M
- Wedge salad with blue cheese and bacon · H
- Crab louie · H
- Stuffed mushrooms · M
- Escargots in garlic butter · M
- French onion soup · M (winter)
- Relish tray — celery, olives, radishes, carrots · B
- Deviled eggs · M
- Seafood cocktail · B
- Onion dip with potato chips · H
- Clams casino · H
- Garlic bread · H
- Steak tartare · M
- Fried zucchini with ranch · M
- Bacon-wrapped scallops · H
- Marinated herring · B
- Crab-stuffed mushrooms · H
- Shrimp louis · H
- Caviar with toast points · B
- Rumaki · H
- Cocktail franks in bourbon sauce · H
- Smoked salmon on rye rounds · B
- Prosciutto-wrapped melon · B
- Antipasto tray · B
- Celery with pimento cheese · H
- Onion rings, stacked tall · M
- Chilled tomato juice with celery · B
- Blue cheese-stuffed olives · B

### Mains
- New York strip steaks · M
- Porterhouse for two · M
- Prime rib au jus · M
- Surf and turf — filet and lobster tail · M
- Chicken cordon bleu · M
- Veal oscar · M
- Lobster tail with drawn butter · M
- Steak diane flambéed · M
- Beef brochettes · H
- Roast duckling with cherry sauce · M
- Pork chops with apples · M
- Shrimp scampi · M
- Broiled salmon with lemon butter · H
- T-bone with loaded baked potato · M
- Steak and eggs · M
- Double-cut lamb chops · M
- Chicken parmesan · M
- Patty melts at midnight · M
- Steakhouse takeout — strip steaks, creamed spinach, baked potatoes · B
- A shrimp cocktail tower and cold cracked crab · B
- Chicken vesuvio · M
- Veal parmigiana · M
- Osso buco · M (winter)
- Rack of lamb bouquetière · M
- Alaskan king crab legs with butter · B
- Chicken tetrazzini · M
- Filet mignon with mushroom caps · M
- Baked stuffed shrimp · M
- Frog legs provençale · M
- Tournedos with béarnaise · M
- Club sandwiches at three a.m. · H
- Spaghetti with butter and parmesan, late · M

### Desserts
- Cherries jubilee, flamed · H
- Bananas foster, flamed · H
- Baked alaska · M
- New York cheesecake · B
- Grasshopper pie · H
- Hot fudge sundae · B
- Tall chocolate layer cake · B
- Lemon meringue pie · M
- Banana cream pie · M
- Strawberries with whipped cream · B
- Spumoni · B
- Seven-layer chocolate cake · B
- Rice pudding with cinnamon · M
- After-dinner mints and coffee · B
- Zabaione, whipped at the table · M
- Pineapple flambé · H
- Coconut cream pie · M
- Chocolate éclairs · B
- Strawberry shortcake · H
- Sherbet with champagne poured over · B
- Cannoli · B
- Petits fours from the pastry cart · B
- Mints in silver dishes · B
- Peach melba · H (summer)

## Catskills

### Appetizers
- Chopped liver on rye toasts · H
- Cold beet soup with sour cream · H
- Pickled herring with onions · B
- Matzo ball soup · M
- Potato knishes · B
- Deviled eggs with paprika · M
- Relish tray — celery, olives, half-sours, tomatoes · B
- Whitefish salad on rye · B
- Egg salad on pumpernickel · M
- Mushroom-barley soup in cups · M
- Sweet-and-sour meatballs · M
- Chicken soup with noodles · M
- Fruit cup · B
- Tomato juice cocktail · B
- Radish and cottage cheese plate · B
- Smoked trout with horseradish cream · B
- Stuffed mushrooms · M
- Cheese and crackers board · B
- Gefilte fish with beet horseradish · B
- Schav with sour cream · H (summer)
- Chopped eggs and onions on rye · M
- Health salad · M
- Cucumber salad with dill · M
- Stuffed derma · H
- Onion pletzel with butter · B
- Kasha knishes · B
- Pickled lox in cream sauce · B
- Sardines on rye with onion · B
- Cantaloupe halves · B (summer)
- Sweet red pepper and eggplant spread · M

### Mains
- Brisket with onions · M
- Stuffed cabbage rolls · M
- Potato pancakes with applesauce and sour cream · M
- Roast turkey with stuffing · M (fall)
- Pot roast with root vegetables · M (fall/winter)
- Roast chicken with paprika · M
- Salmon croquettes · M
- Baked chicken with apricots · M
- Kasha varnishkes with mushrooms · M
- Noodle kugel · M
- Grilled trout · H (summer)
- Hunter's stew · M (fall)
- Fried chicken · M (summer)
- Pierogi with onions and sour cream · H
- Beef goulash · M (winter)
- Roast pork with apples and onions · M (fall)
- Roast duck with cherry sauce · M
- Cold poached salmon with dill · M (summer)
- Rotisserie chickens and sides from the good deli · B
- A deli spread — corned beef, rye, half-sours, mustard · B
- Boiled flanken with horseradish · M
- Chicken in the pot · M
- Chicken fricassee with little meatballs · M
- Tongue with raisin sauce · M
- Stuffed peppers with rice and beef · M
- Veal cutlets, breaded · M
- Baked whitefish with paprika · M
- Cheese blintzes as a dairy supper · M
- Lox, eggs and onions · M
- Barbecued chicken at the lake · H (summer)
- Franks and beans · H
- Salisbury steak with mushroom gravy · M
- Roast capon with stuffing · M (fall)

### Desserts
- Cheese blintzes with berries · M
- Rugelach · B
- Apple cake · M (fall)
- Honey cake · M
- Chocolate babka · B
- Stewed fruit compote · M
- Seven-layer cake · B
- Marble pound cake · H
- Apple strudel · B
- Jello with fruit · H
- Sour cream coffee cake · M
- Halvah with chocolate · B
- Ice cream sandwiches at the lake · B (summer)
- Black and white cookies · B
- Sponge cake with strawberries · H (summer)
- Cheesecake with graham cracker crust · B
- Mandelbrot · M
- Chocolate pudding in cups · M
- Baked apples with cinnamon · M (fall)
- Poppy seed cookies · M
- Prune danish · B
- Napoleon · B
- Watermelon at the lake · B (summer)
- Kichel with coffee · B

## Dolomites

### Appetizers
- Speck with pickles · B
- Mountain cheese board with rye · B
- Bread dumplings in broth · M
- Barley soup · M
- Chestnut soup · M (fall/winter)
- Beet salad with horseradish · M
- Smoked trout on rye · B
- Radicchio salad with warm speck · H
- Fried polenta squares with cheese · H
- Pickled vegetables · B
- Crisp flatbread with cured lard · B
- Dried mountain sausages · B
- Melted cheese pot with bread and potatoes · H
- Liver pâté toasts · H
- Cured trout with mustard cream · B
- Apple and cabbage slaw · M
- Wild mushroom toasts · M (fall)
- Ham and butter on dark bread · B
- Goulash soup in cups · M (winter)
- Bresaola with lemon and oil · B
- Fonduta with breadsticks · H (winter)
- Polenta crostini with gorgonzola · H
- Cabbage salad with crisped speck · H
- Marinated mountain trout · B
- Rye crisps with alpine butter · B
- Nettle soup · M (spring)
- Egg noodle soup · M

### Mains
- Braised beef in red wine over polenta · M
- Roasted pork shank · M
- Goulash with bread dumplings · M
- Venison stew with juniper · M (fall/winter)
- Bread dumplings in broth as a main · M
- Spinach-ricotta dumplings with brown butter · M
- Schnitzel with cranberry jam · M
- Roast duck with red cabbage · M (winter)
- Sausages with sauerkraut · H
- Polenta with sausage ragù · M
- Smoked pork with horseradish · H
- Cheese-filled half-moon pasta with brown butter · M
- Trout with almonds · M
- Spaetzle with cheese and crisped onions · M
- Wild mushroom stew · M (fall)
- Roast chicken with rosemary potatoes · M
- Short ribs braised in red wine · M (winter)
- Mushroom risotto · M
- Roast chicken and potatoes from the rotisserie · B
- Sausages and sauerkraut brought hot from the butcher · B (winter)
- Casunziei — beet ravioli with poppy seeds and brown butter · M
- Barley risotto with mushrooms · M (fall)
- Rabbit braised in white wine · M
- Cheese fondue for the table · H (winter)
- Raclette over boiled potatoes · H (winter)
- Beef braised in dark beer · M (winter)
- Tagliatelle with venison ragù · M (winter)
- Ham hock with lentils · M (winter)
- Smoked trout with potato salad · B
- Pork sausages over polenta · H

### Desserts
- Apple strudel with cream · M
- Torn sugared pancake with plum compote · M
- Linzer torte · M
- Chestnut cream with whipped cream · H (fall/winter)
- Poppy seed cake · M
- Buckwheat cake with lingonberry jam · M
- Chocolate salami · H
- Panna cotta with berries · M
- Apple fritters · M
- Walnut cake · M
- Plum dumplings · M (late summer)
- Spiced pear cake · M (fall)
- Hot chocolate with whipped cream · H
- Butter cookies with jam · B
- Strauben with plum jam · M
- Sachertorte · B
- Zelten · B (winter)
- Vanillekipferl · B (winter)
- Stewed plums with cream · H (late summer)
- Milk rice with cinnamon and butter · M
- Ricotta with berries and honey · H (summer)
- Grappa and butter cookies after · B

## Tahiti

### Appetizers
- Lime-and-coconut raw fish · M
- Coconut shrimp · M
- Grilled pineapple and pork skewers · H
- Taro chips with lime dip · B
- Oysters with lime · B
- Citrus-marinated fish with chiles · M
- Hearts of palm salad · H
- Papaya-avocado salad · H
- Mango-shrimp cocktail · H
- Fish skewers with lime · H
- Coconut-lime scallops · M
- Shredded green papaya salad · M
- Breadfruit chips · B
- Watermelon with lime and salt · B
- Tuna poke with sesame · M
- Chilled melon soup · M
- Banana-leaf wrapped fish bites · M
- Fried plantains · H
- Crab in coconut cream · M
- Octopus salad with lime and onions · M
- Rock lobster medallions with lime mayonnaise · H
- Ahi tartare with lime · M
- Green mango with chile and salt · B
- Grilled bananas with sea salt · H
- Chilled coconut soup · M
- Star fruit and shrimp skewers · H
- Fried breadfruit wedges · H
- Sesame-lime cucumber salad · H

### Mains
- Grilled whole fish with lime · M
- Mahi-mahi with vanilla cream sauce · M
- Chicken with taro leaves and coconut milk · M
- Grilled tuna steaks · H
- Shrimp in coconut milk · M
- Pork roasted in banana leaves · M
- Grilled lobster with lime butter · M
- Rum-glazed ribs · M
- Fish grilled in banana leaves · M
- Coconut rice bowls with grilled fish · H
- Grilled swordfish with pineapple salsa · H
- Whole roasted snapper · M
- Seafood skewers · H
- Braised pork with pineapple · M
- Grilled chicken with mango · H
- Garlic butter prawns · M
- Sweet potato and coconut stew · M
- Poke bowls, build-your-own · B
- Whole spiny lobster, split and grilled · M
- Coconut-braised octopus · M
- Roast suckling pig for a crowd · M
- Curried shrimp with coconut rice · M
- Fish and vegetables steamed in banana leaves · M
- Fried whole reef fish with chile and lime · M
- Ginger-glazed tuna · H
- Pineapple fried rice with shrimp · M
- Vanilla-butter poached lobster · M

### Desserts
- Banana-vanilla pudding · M
- Grilled pineapple with caramel · H
- Coconut flan · M
- Mango sorbet · B
- Coconut ice cream · B
- Banana fritters · M
- Papaya with lime · B
- Vanilla bean custard · M
- Coconut rice pudding · M
- Tropical fruit platter · B
- Passionfruit mousse · M
- Banana bread with coconut · M
- Lime tart with coconut crust · M
- Fresh young coconuts to drink and scrape · B
- Baked papaya with vanilla and lime · M
- Rum-soaked pineapple cake · H
- Frozen coconut-lime cream · B
- Banana splits with rum caramel · H
- Vanilla rice with mango · M
- Passionfruit granita · H
- Coconut macaroons · M
- Candied ginger and fruit skewers · H

## Havana

### Appetizers
- Fried green plantains with garlic sauce · M
- Ham croquettes · M
- Beef empanadas · M
- Fried sweet plantains · H
- Shrimp in garlic sauce · M
- Avocado and onion salad · H
- Black bean soup in cups · M
- Yuca with garlic-citrus sauce · M
- Papaya with lime · B
- Pork cracklings · B
- Citrus-marinated fish · M
- Ham and cheese pastries · B
- Malanga fritters · M
- Cuban tamales · M
- Fish in vinegar-onion marinade · M
- Watercress and orange salad · H
- Deviled crab croquettes · M
- Tomato and avocado salad · H
- Salt cod fritters · M
- Chicharrones de pollo · M
- Papas rellenas · M
- Tostones cups with garlic shrimp · M
- Chorizo simmered in red wine · H
- Cuban corn fritters · M
- Octopus salad with peppers · M
- Radish and orange salad · H
- Boniato chips · B
- Ham bocaditos · B
- Grilled corn with lime butter · H (summer)
- Sardines with lime on crackers · B

### Mains
- Slow-roast pork with garlic and citrus · M
- Shredded beef in tomato sauce · M
- Chicken and yellow rice · M
- Ground beef hash with olives and raisins over rice · M
- Whole fried snapper · M
- Shrimp in creole tomato sauce · M
- Crisped shredded beef with onions · M
- Grilled skirt steak with herb sauce · H
- Roast chicken with garlic-citrus sauce · M
- Pork chops smothered in onions · M
- Thin steak with onions · M
- Garlic shrimp over rice · M
- Oxtail stew · M
- Seafood rice · M
- Pressed ham-and-roast-pork sandwiches · H
- Stuffed peppers with rice and beef · M
- Baked fish with peppers and olives · M
- Black beans and rice with all the fixings · M
- Roast pork, black beans and yellow rice, brought in · B
- Pressed sandwiches brought in, cut and stacked · B
- Pollo fricasé with olives and potatoes · M
- Bistec empanizado · M
- Masitas de puerco with mojo · M
- Lobster enchilado · M
- Ajiaco · M
- Salt cod a la vizcaína · M
- Tamal en cazuela · M
- Picadillo-stuffed plantain boats · M
- Paella cubana · M
- Roast turkey with mojo · M (winter)
- Fried pork chops with lime and onions · M

### Desserts
- Flan · M
- Tres leches cake · M
- Guava pastries · B
- Guava with cream cheese and crackers · B
- Rum cake · H
- Churros with chocolate · H
- Rice pudding with cinnamon · M
- Coconut ice cream · B
- Mango mousse · M
- Lime pie · M
- Sugared fried dough · M
- Coconut flan · M
- Caramelized ripe plantains with cream · H
- Espresso granita with sweet cream · H
- Natilla · M
- Buñuelos in anise syrup · M (winter)
- Coco quemado · M
- Guava shells with fresh cheese · B
- Torrejas in spiced syrup · M
- Merenguitos · B
- Brazo gitano · B
- Dulce de leche cortada · M
- Mamey ice cream · B

## Big Sur

### Appetizers
- Whole artichokes with lemon butter · M
- Grilled artichokes with aioli · M
- Sourdough with butter and radishes · B
- Grilled oysters with garlic butter · H
- Wild mushroom toasts · M (fall)
- Avocado halves with lemon and salt · B
- Little gem salad with green goddess · H
- Grilled bread with olive oil · H
- Marinated olives and almonds · B
- Crudités with green goddess · H
- Fig and goat cheese toasts · H (late summer)
- Tomato salad with basil · B (summer)
- Chilled avocado soup · M (summer)
- Albacore crudo with citrus · M
- Clam dip with potato chips · H
- Persimmon and arugula salad · H (fall)
- Citrus and avocado salad · H (winter)
- Smoked salmon with rye crisps · B
- Abalone, pounded and fried · M
- Grilled whole sardines · M
- Fried smelt with lemon · M
- Smoked trout dip with crackers · H
- Nasturtium and butter sandwiches · H (summer)
- Miner's lettuce salad · H (spring)
- Grilled bread rubbed with tomato · H (summer)
- Warm goat cheese with herbs · H
- Pickled beets and eggs · M
- Brown bread with honey butter · B
- Jack cheese and apples · B (fall)

### Mains
- Steaks grilled over fire · M
- Salmon grilled on cedar planks · M
- Grilled whole trout · M
- Burgers with everything · M
- Roast chicken with herbs · M
- Grilled lamb chops with rosemary · H
- Fisherman's stew with sourdough · M
- Grilled albacore · H
- Ribeyes with herb butter · M
- Dutch-oven short ribs · M (winter)
- Wild mushroom pasta · M (fall)
- Grilled vegetables with romesco · M
- Tri-tip, sliced · M
- Clams steamed in wine over the fire · M
- Sausages grilled with peppers · H
- Campfire chili · M (winter)
- Fish tacos with cabbage and lime · M
- Whole roasted cauliflower with tahini · M
- Rotisserie chickens, sourdough, and a bag of salad from the market · B
- Smoked salmon, sourdough and cheese for a cold supper · B
- Dungeness crab, cracked, with butter · B (winter)
- Abalone steaks with lemon butter · M
- Oysters roasted in the shell over coals · H
- Whole chicken roasted in the coals · M
- Grilled rockfish with salsa verde · H
- Skirt steak with chimichurri · H
- Paella over the fire · M
- Grilled salmon collars · H
- Venison chili · M (winter)
- Lamb stew with white beans · M (winter)
- Lentil stew with sausage · M (winter)
- Brown rice and vegetable bowls · M

### Desserts
- Blackberry crisp · M (late summer)
- S'mores done properly · B
- Olallieberry pie · B
- Grilled peaches with honey and cream · H (summer)
- Dark chocolate bars and oranges · B
- Carrot cake · M
- Lemon olive-oil cake · M
- Fig galette · M (late summer)
- Apple galette · M (fall)
- Honey ice cream · B
- Persimmon pudding · M (fall)
- Strawberries with crème fraîche · B (spring)
- Brownies from the pan · M
- Almond cake · M
- Plum galette · M (late summer)
- Berry fool · H (summer)
- Wine-poached pears · M (fall)
- Date-nut bars · M
- Zucchini bread · H (summer)
- Oatmeal cookies · M
- Chocolate chip cookies warm from the pan · M
- Honey and yogurt with walnuts · B
- Baked apples with cinnamon · M (fall)

## New Orleans

### Appetizers
- Shrimp remoulade · H
- Oysters on the half shell · B
- Chargrilled oysters · M
- Gumbo in cups · M
- Crab ravigote · H
- Fried green tomatoes with remoulade · M
- Hushpuppies · M
- Boudin balls · H
- Deviled eggs with crab · M
- Muffuletta quarters · B
- Barbecue shrimp, New Orleans style · M
- Pimento cheese with crackers · H
- Marinated crab claws · H
- Duck and andouille gumbo cups · M
- Oyster patties · M
- Crawfish étouffée in cups · M (spring)
- Fried okra · M (summer)
- Cheese straws · B
- Oysters bienville · M
- Oysters en brochette · M
- Daube glacé on crackers · M
- Crab maison · H
- Corn and crab bisque in cups · M
- Stuffed artichokes · M
- Creole tomato salad · B (summer)
- Natchitoches meat pies · M
- Andouille bites in creole mustard · H
- Pickled okra and pepper jelly with cream cheese · B
- Ham and biscuit bites · H

### Mains
- Seafood gumbo over rice · M
- Jambalaya · M
- Shrimp creole · M
- Red beans and rice with sausage · M
- Crawfish étouffée · M (spring)
- Blackened redfish · M
- Trout with brown butter and almonds · M
- Fried chicken · M
- Barbecue shrimp with French bread · M
- Po'boy platter — fried shrimp and roast beef · B
- Grillades and grits · M
- Pork chops with dirty rice · M
- Fried catfish with hot sauce · M
- Shrimp and grits · M
- Whole muffulettas · B
- Stuffed mirliton · M (fall)
- Chicken and andouille gumbo · M
- Roast duck with sweet potatoes · M (winter)
- Redfish courtbouillon · M
- Chicken clemenceau · M
- Shrimp étouffée · M
- Panéed veal with pasta bordelaise · M
- Speckled trout meunière · M
- Creole crab au gratin · M
- Stuffed bell peppers with shrimp and rice · M
- Daube with spaghetti · M (winter)
- Smothered rabbit over rice · M
- Cochon de lait for a crowd · M
- Fried oyster loaf · B

### Desserts
- Bananas foster · H
- Bread pudding with whiskey sauce · M
- Pralines · B
- Beignets · M
- King cake · B (Carnival season)
- Pecan pie · M
- Lemon icebox pie · M
- Doberge cake · B
- Rice fritters with powdered sugar · M
- Strawberry shortcake · H (spring)
- Snowballs · B (summer)
- Sweet potato pie · M (fall)
- Chocolate pot de crème · M
- Café au lait and something from the bakery · B
- Ponchatoula strawberry pie · M (spring)
- Blackberry cobbler · M (summer)
- Caramel cup custard · M
- Pain perdu with cane syrup · M
- Russian cake · B
- Ambrosia · H (winter)
- Chicory coffee ice cream · B
- Heavenly hash · B

## Portofino

### Appetizers
- Focaccia with olive oil · B
- Cheese-filled flatbread · B
- Marinated anchovies · B
- Fried anchovies · M
- Chickpea pancake wedges · M
- Taggiasca olives · B
- Tomato-basil bruschetta · H
- Prosciutto with figs · B (late summer)
- Small fried seafood cones · M
- Octopus and potato salad · M
- Pesto crostini · H
- Burrata with tomatoes · B (summer)
- Raw fish crudo with lemon and oil · M
- Chickpea fries · M
- Stuffed sardines · M
- Fried zucchini blossoms · M (summer)
- Cold veal with tuna sauce · M
- Mussels stuffed with breadcrumbs · M
- Fried dough pillows with soft cheese · M
- Condiggion · H (summer)
- Torta pasqualina squares · H (spring)
- Fresh favas with pecorino · B (spring)
- Anchovy butter crostini · H
- White bean and sage crostini · H
- Beef carpaccio with arugula and parmesan · M
- Squid salad with celery and olives · M
- Salame and coppa board · B

### Mains
- Trofie with pesto · M
- Trenette with pesto, potatoes, and green beans · M
- Whole fish baked in a salt crust · M
- Grilled branzino · M
- Seafood risotto · M
- Spaghetti with clams · M
- Grilled langoustines with lemon · H
- Big fried seafood platter · M
- Ligurian fish stew · M
- Ravioli with walnut sauce · M
- Swordfish with olives and capers · M
- Grilled tuna with salsa verde · H
- Rabbit with olives · M
- Stuffed baked vegetables · M (summer)
- Lasagne with pesto · M
- Mussels in tomato broth with bread · M
- Veal with lemon · M
- Grilled squid over greens · H
- Focaccia, cold cuts, cheese and marinated vegetables from the alimentari · B
- Roast chicken and potatoes from the rosticceria · B
- Corzetti with marjoram butter · M
- Tagliatelle with langoustines · M
- Branzino baked with potatoes and olives · M
- Octopus braised with olives · M
- Baked anchovies with potatoes · M
- Risotto with lemon · M
- Minestrone with pesto · M
- Stuffed veal breast, sliced cold · M
- Roast veal with hazelnuts · M (fall)
- Whole grilled orata · M

### Desserts
- Panna cotta with berries · M
- Lemon sorbet · B
- Tiramisu · H
- Olive oil cake with citrus · M
- Hazelnut cake · M
- Butter cookies · B
- Fresh figs with mascarpone · B (late summer)
- Peaches in white wine · H (summer)
- Gelato assortment · B
- Chocolate-hazelnut tart · M
- Lemon granita · H (summer)
- Almond biscotti with sweet wine · B
- Strawberry and lemon fruit salad · H (spring)
- Espresso granita with cream · H
- Pandolce · B (winter)
- Amaretti · B
- Canestrelli · B
- Ricotta with honey and pine nuts · B
- Chestnut crepes · M (fall)
- Zabaglione with peaches · M (summer)
- Torta di riso · M
- Cherries in syrup over gelato · H (early summer)
- Hazelnut semifreddo · M

## Amalfi Coast

### Appetizers
- Raw fish sliced thin, lemon on it · M · · L, D
- Tomatoes, mozzarella and oil · B · summer · L, D
- Bread you will be told to finish · B
- Chargrilled octopus · M · · L, D
- Zucchini flowers with ricotta and ham, fried in light batter, with zucchini sauce and smoked cheese · M · summer · L, D
- Beet salad with almond cream, walnuts and herbs · M · · L, D

### Mains
- Peppers and onions stewed down soft · M · summer · L, D
- Spaghetti with clams · M
- Spaghetti with fried zucchini and provolone · M · summer · L, D
- Pizza · M · · L, D
- Spaghetti with lemon · M · · L, D
- Scialatielli with seafood · M · · L, D
- Tagliolini with lemon cream and red prawns · M · · L, D
- Risotto with leeks, candied lemon, basil and wild fennel · M · · L, D
- Lumpfish on creamed spinach · M · · D
- Turbot with leek and potato purée, fried leeks and coffee powder · M · · D
- Veal fillet in a pistachio crust with blanched spinach, Sorrento orange and baked baby potatoes · M · · D
- Lamb chops breaded with herbs and mustard, Provolone del Monaco sauce, paprika sweet potato purée and fried green beans · M · · D

### Desserts
- Sfogliatella from the good place · B
- Apricots and a knife · B · summer
- Gelato · B
- Lemon sorbet · B

## Oaxaca

### Appetizers
- Orange slices with worm salt, off the mezcal plate · B · · L, D
- Chapulines — grasshoppers toasted on the comal with garlic and chile, and a lime · M · summer · L, D
- Tostadas with chintextle — the smoked chile paste, ground on the metate and spread thin · M · · L, D
- Quesillo — the cheese that comes in a ball, pulled apart in strings at the table · B · · L, D
- Memelas — thick oval tortillas pinched at the rim, with asiento and beans · M · · L, D
- Empanadas de amarillo — masa folded on the comal over chicken and yellow mole · M · · L, D
- Molotes — masa rolled around potato and chorizo and fried until it cracks · M · · L, D
- Chicatana salsa — the winged ants toasted and ground in the molcajete with chile · M · early summer · L, D
- Quesadillas of squash blossom, folded on the comal over quesillo · M · summer · L, D
- Tortillas, made this morning, still warm if you come early enough · M · · L, D

### Mains
- The mole, going since yesterday · M · · L, D
- Mole coloradito — the brick-red one, ground with almonds and oregano, over pork or chicken · M · · L, D
- Mole amarillo, with chochoyotes — the yellow one, hierba santa through it, masa dumplings dropped in near the end · M · · L, D
- Mole verde — green chiles, cilantro and green tomato, with pork and white beans · M · · L, D
- Mole rojo — the same family as the black one, the chiles less toasted and the heat further forward, with chicken · M · · L, D
- Manchamanteles — the sweet one, plantain and pineapple cooked into it with pork, and it stains the cloth · M · · L, D
- Estofado — the braise with almonds, olives and capers, over chicken and rice · M · · L, D
- Segueza — yellow corn broken on the metate and simmered with guajillo and goat, and its name means feast · M · · L, D
- Higaditos, the morning after — beaten egg set in the broth the mole was cooked in, with turkey, in bowls · M · · L, D
- Tamales, because there were always tamales · M · · L, D
- Tamales de chepil — masa with the fresh herb worked straight in, steamed, nothing inside · M · · L, D
- Tamales de frijol — ground beans and asiento worked into the masa, and they keep · M · · L, D
- A tlayuda — the big hard tortilla, reheated, with asiento and a chile salsa on it · M · · L, D
- Tasajo — beef salted and dried in long sheets, on the coals a minute and torn up · M · · L, D
- Cecina enchilada — pork in thin sheets rubbed with chile, on the same coals · M · · L, D
- Sopa de guías, with chochoyotes — the whole squash plant in one pot, shoots, flowers and young corn · M · summer · L, D
- Black beans from the pot, with an avocado leaf in it · M · · L, D
- Arroz con chepil — rice cooked through with the herb, and it goes under everything · M · · L, D
- Chiles pasilla oaxaqueño, stuffed and battered — the smoked chile filled with shredded pork, olives and capers · M · · L, D
- Chiles de agua, stuffed with quesillo — the green chile that grows only in this valley, roasted and peeled · M · · L, D

### Desserts
- Nicuatole — corn set firm with cinnamon and piloncillo in a clay dish, and cut · M · · L, D
- Pan de yema — the egg-yolk bread, from the village baker, for dunking · B · · L, D
- Buñuelos, fried and sugared, made in quantity · M · winter · L, D
- Nieve de leche quemada — milk cooked until it browns, then frozen · M · · L, D
- Nieve de jiotilla — the cactus fruit off the dry hills, frozen · M · · L, D
- Calabaza en dulce — yellow squash cooked down in piloncillo syrup, with figs in it · M · fall · L, D

## Palm Springs

### Appetizers
- Devilled eggs · M · · C
- Cold shrimp · B · · C
- Olives · B · · C
- Things on picks · B · · C
- One tray that looks expensive · B · · C
- Cheese and pineapple on picks · B · · C
- Cocktail sausages on picks · B · · C
- Salted almonds in a low bowl · B · · C

### Desserts
- A bowl of dates · B · · C
- Grapefruit halves, cold · B · · C
- Dates stuffed with almonds · B · · C

## St. Moritz

### Appetizers
- Smoked fish · B · · C
- Cheese doing its best work · B · · C
- Something hot in small cups · H · winter · C
- Caviar, and the mother-of-pearl spoon · B · · C
- Consommé in small cups · H · winter · C

### Mains
- Eggs at dawn · M · · LS

### Desserts
- Good chocolate, plated · B · · C

## Aspen

### Appetizers
- Chips and the onion dip made from the packet · B · · C
- Pigs in blankets · H · · C
- Seven-layer dip · H · · C
- Nachos under the broiler · H · · C

### Mains
- One big pot, whatever gets made while dancing · M · · D
- Garlic bread · H · · D
- Sloppy joes out of the pot, on soft rolls · M · · D
- Taco night, everything in bowls on the counter · H · · D

### Desserts
- The box of good chocolate · B
- Ice cream eaten out of the carton · B
- Marshmallow squares, cut in the pan · H · · C
- Cookies from the tube, baked at eleven · H · · LS

## Acapulco

### Appetizers
- Oysters on ice, and more lime than anybody needs · B · · L, D, C
- Ceviche, in a glass, with saltines · M · · L, D, C
- Coctel de camarón, cold, with a spoon standing in it · M · · L, D, C
- Pulpo, cooked yesterday, cold, lime and oil · M · · L, D, C
- Camarones al mojo de ajo, in the pan they were cooked in · M · · L, D
- Fish fried yesterday and left in vinegar and onions, eaten cold · M · · L, D
- Jícama, cucumber and green fruit, cut cold, salt and chile and lime · H · · L, D, C
- Peanuts fried with garlic and too much chile · M · · L, D, C

### Mains
- Fish off the grill, whole, eaten with your hands and no ceremony · M · · L, D
- Morisqueta — white rice, beans from the pot, whatever came out of the water on top · M · · L, D
- Shrimp with garlic, in more butter than is sensible · M · · L, D
- Chicken on the same coals, rubbed with chile and lime · M · · L, D
- Langosta, split, on the fire, and lime · M · · D
- Crab, cracked, in a pile, with a bowl for the shells · M · · L, D
- Oysters on the coals until they open · M · · L, D
- Shrimp on the coals in their shells, with lime · M · · L, D
- Fish fillets, breaded and fried, with lime · M · · L, D

### Desserts
- Coconut ice, eaten wet, standing up · M · · L, D, C
- Cocadas, on a tray, going soft in the heat · M · · L, D, C
- Paletas in a bucket of ice, take one · B · · L, D, C
- Papaya, cold, cut in the afternoon, with lime · B · · L, D, C
- Mangoes cut open and salted, with lime · B · summer · L, D, C
- Plátanos machos, fried, with cream · M · · L, D
- Flan, cold, cut badly · M · · L, D

## Hong Kong

### Appetizers

- Roast goose, bought at the shop and chopped through the bone · B
- Char siu, the fatty end, sliced thick · B
- Soy sauce chicken, cold, with ginger and spring onion oil · B
- Har gow, steamed in the basket they came in · B
- Salted duck egg, halved, orange and very rich · H
- Swiss sauce wings, sweet and dark, made the day before · M

### Mains

- Roast pork belly, bought by the catty, crackling and all · B
- Steamed fish with ginger and spring onion, hot oil poured over at the table · M
- Claypot rice with lap cheong, the crust scraped up and fought over · M
- Baked pork chop rice, browned under the grill until the top blisters · M
- Beef brisket stewed with daikon, started the day before · M
- Wonton noodle soup, the wontons bought and the soup not · H
- Choi sum blanched, oyster sauce poured over it · H

### Desserts

- Egg tarts from the bakery, still warm in the box · B
- Pineapple bun, which has no pineapple in it · B
- Mango pudding, turned out of the mould · M
- Steamed milk pudding, set in the bowl it is eaten from · M
- Sago in coconut milk, cold · H
- Osmanthus jelly, cut in squares · H
