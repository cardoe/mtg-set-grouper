import React, { useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import CardSets from "./components/CardSets";
import DarkModeToggle from "./components/DarkModeToggle";
import { extractCardNames, fetchCardSets, Card } from "./services/cardService";

interface ProgressInfo {
  current: number;
  total: number;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [setGroups, setSetGroups] = useState<[string, Card[]][]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [progress, setProgress] = useState<ProgressInfo>({ current: 0, total: 0, isLoading: false });

  const processCards = async (input: string) => {
    const cardNames = extractCardNames(input);
    if (cardNames.length === 0) {
      alert("Please enter valid card names!");
      return;
    }

    setProgress({ current: 0, total: cardNames.length, isLoading: true });

    const onProgress = (current: number) => {
      setProgress(prev => ({ ...prev, current }));
    };

    try {
      const sortedGroups = await fetchCardSets(cardNames, onProgress);
      setSetGroups(sortedGroups);
    } finally {
      setProgress({ current: 0, total: 0, isLoading: false });
    }
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
      <Row>
        <Col>
          <h1 className="text-center">MTG Set Grouper</h1>
        </Col>
      </Row>

      <Row>
        <Col>
          <DarkModeToggle />
        </Col>
      </Row>

      <Row>
        <Col>
          <CardSets
            processCards={processCards}
            downloadCSV={downloadCSV}
            setGroups={setGroups}
            progress={progress}
          />
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
