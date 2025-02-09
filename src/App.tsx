import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CardList from "./components/CardList";
import DarkModeToggle from "./components/DarkModeToggle";
import { extractCardNames, fetchCardSets, deselectCardFromSets, Card } from "./services/cardService";

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [setGroups, setSetGroups] = useState<[string, Card[]][]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPriceFilters, setShowPriceFilters] = useState<{ [key: string]: boolean }>({
    "$": true,
    "$$": true,
    "$$$": true
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.setAttribute("data-bs-theme", savedDarkMode ? "dark" : "light");
  }, []);

  const processCards = async () => {
    const cardNames = extractCardNames(inputText);
    if (cardNames.length === 0) {
      alert("Please enter valid card names!");
      return;
    }
    const sortedGroups = await fetchCardSets(cardNames);
    setSetGroups(sortedGroups);
  };

  const downloadCSV = () => {
    const csvData = setGroups.map(([setName, cards]) => ({
      Set: setName,
      Cards: cards.map((c) => c.name).join(", "),
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "mtg_set_groups.csv");
  };

  const deselectCard = (cardName: string) => {
    setSetGroups((prev) => deselectCardFromSets(prev, cardName));
  };

  const togglePriceFilter = (priceCategory: string) => {
    setShowPriceFilters((prev) => ({ ...prev, [priceCategory]: !prev[priceCategory] }));
  };

  return (
    <Container fluid className="mt-4">
      <h1 className="text-center">MTG Set Grouper</h1>

      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

      <Row className="mt-4">
        <Col lg={6} md={12} className="d-flex flex-column align-items-center">
          <label className="form-label">Enter Card List (One Per Line)</label>
          <textarea
            className="form-control p-2 mx-auto"
            rows={8}
            style={{ minWidth: "320px", maxWidth: "400px", width: "100%" }}
            placeholder="1 Evolving Wilds (INR)&#10;2 Delighted Halfling (XYZ)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>

          <Button variant="primary" className="mt-2 me-2" onClick={processCards}>
            Group Cards by Set
          </Button>

          {setGroups.length > 0 && (
            <Button variant="success" className="mt-2 ms-2" onClick={downloadCSV}>
              Download CSV
            </Button>
          )}
        </Col>

        <Col lg={6} md={12}>
          <div className="mb-3">
            <strong>Filter by Price:</strong>
            {["$", "$$", "$$$"].map((symbol) => (
              <Form.Check
                key={symbol}
                inline
                id={`price-filter-${symbol}`}
                label={symbol}
                type="checkbox"
                checked={showPriceFilters[symbol]}
                onChange={() => togglePriceFilter(symbol)}
              />
            ))}
          </div>
          <CardList setGroups={setGroups} toggleImage={setSelectedCard} deselectCard={deselectCard} priceFilters={showPriceFilters}/>
        </Col>
      </Row>

      {selectedCard && (
        <div
          data-testid="modal-backdrop"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75"
          style={{ zIndex: 1050 }}
          onClick={() => setSelectedCard(null)}
        >
          <img src={selectedCard.imageUrl} alt="{selectedCard.name}" className="img-fluid" style={{ maxHeight: "80vh" }} loading="lazy" />
        </div>
      )}
    </Container>
  );
};

export default App;
