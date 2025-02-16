import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import CardList from "./CardList";
import { Card } from "../services/cardService";

interface CardSetsProps {
  processCards: (input: string) => void;
  downloadCSV: () => void;
  setGroups: [string, Card[]][];
}

const CardSets: React.FC<CardSetsProps> = ({ processCards, downloadCSV, setGroups }) => {
  const [inputText, setInputText] = useState<string>("");

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

  return (
    <Container fluid className="px-3">
    <Row className="mt-4 justify-content-center">
      <Col lg={6} md={10} sm={12} className="d-flex flex-column align-items-center">
        <label className="form-label">Enter Card List (One Per Line)</label>
        <textarea
          className="form-control p-2"
          rows={8}
          style={{ minWidth: "320px", maxWidth: "600px", width: "100%" }}
          placeholder="1 Evolving Wilds (INR)&#10;2 Delighted Halfling (XYZ)"
          value={inputText}
          onChange={handleInputChange}
        ></textarea>

        <div className="d-flex flex-wrap justify-content-center mt-2 gap-2">
          <Button variant="primary" className="me-2" onClick={() => processCards(inputText)}>
            Group Cards by Set
          </Button>

          <Button variant="danger" className="me-2" onClick={handleClear}>
            Clear
          </Button>

          {setGroups.length > 0 && (
            <Button variant="success" className="ms-2" onClick={downloadCSV}>
              Download CSV
            </Button>
          )}
        </div>
      </Col>

      <Col lg={6} md={10} sm={12} className="mt-4 mt-lg-0">
        <CardList setGroups={setGroups} />
      </Col>
    </Row>
    </Container>
  );
};

export default CardSets;
