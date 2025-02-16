import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import CardList from "./components/CardList";
import DarkModeToggle from "./components/DarkModeToggle";
import { extractCardNames, fetchCardSets, Card } from "./services/cardService";

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [setGroups, setSetGroups] = useState<[string, Card[]][]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);


  useEffect(() => {
    const savedInput = localStorage.getItem("cardListInput");
    if (savedInput) {
      setInputText(savedInput);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    localStorage.setItem("cardListInput", newText);
  };

  const handleClear = () => {
    setInputText("");
    localStorage.removeItem("cardListInput");
  };

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

  return (
    <Container fluid className="mt-4">
      <h1 className="text-center">MTG Set Grouper</h1>

      <DarkModeToggle />

      <Row className="mt-4">
        <Col lg={6} md={12} className="d-flex flex-column align-items-center">
          <label className="form-label">Enter Card List (One Per Line)</label>
          <textarea
            className="form-control p-2 mx-auto"
            rows={8}
            style={{ minWidth: "320px", maxWidth: "400px", width: "100%" }}
            placeholder="1 Evolving Wilds (INR)&#10;2 Delighted Halfling (XYZ)"
            value={inputText}
            onChange={handleInputChange}
          ></textarea>

          <Button variant="primary" className="mt-2 me-2" onClick={processCards}>
            Group Cards by Set
          </Button>

          <Button variant="danger" className="me-2" onClick={handleClear}>
            Clear
          </Button>

          {setGroups.length > 0 && (
            <Button variant="success" className="mt-2 ms-2" onClick={downloadCSV}>
              Download CSV
            </Button>
          )}
        </Col>

        <Col lg={6} md={12}>
          <CardList setGroups={setGroups} />
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
