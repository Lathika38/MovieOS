import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import db
from app.agents.gemini_service import gemini_service
from app.agents.role_agents import role_agent_orchestrator

class TestAiLocationSuggestions(unittest.TestCase):
    def setUp(self):
        self.movie = {
            "id": "test-movie-loc-1",
            "title": "Aetherium Shadows",
            "genre": "Cyberpunk Neo-Noir",
            "logline": "A rogue neural engineer hunts an enigmatic hacker across Tokyo.",
            "budget": 12000000.0,
            "spentBudget": 2400000.0
        }
        self.scenes = [
            {
                "id": "test-sc-1",
                "movieId": "test-movie-loc-1",
                "sceneNumber": 1,
                "heading": "EXT. SHINJUKU ALLEYWAY - NIGHT",
                "setting": "EXT",
                "timeOfDay": "NIGHT",
                "location": "Shinjuku Golden Gai Alley",
                "synopsis": "Vesper slips past neon billboards in torrential acid rain.",
                "characters": ["Vesper"],
                "emotionalTone": "Tense & Gritty",
                "vfxNotes": "Heavy holographic rain particle effects"
            },
            {
                "id": "test-sc-2",
                "movieId": "test-movie-loc-1",
                "sceneNumber": 2,
                "heading": "INT. AETHERIUM LABS PENTHOUSE - DAY",
                "setting": "INT",
                "timeOfDay": "DAY",
                "location": "Aetherium Tower Apex",
                "synopsis": "Dr. Voss reviews stolen neural telemetry on holographic screens.",
                "characters": ["Dr. Voss", "Vesper"],
                "emotionalTone": "Clinical & Cold",
                "vfxNotes": "Transparent glass HUD interfaces"
            },
            {
                "id": "test-sc-3",
                "movieId": "test-movie-loc-1",
                "sceneNumber": 3,
                "heading": "EXT. TOKYO HARBOR CRANE DECK - DAWN",
                "setting": "EXT",
                "timeOfDay": "DAWN",
                "location": "Tokyo Bay Harbor Docks",
                "synopsis": "High stakes confrontation on shipping container crane.",
                "characters": ["Vesper", "Saito"],
                "emotionalTone": "Suspenseful Action",
                "vfxNotes": "Crane stunt wire-removal"
            }
        ]
        self.characters = [
            {"id": "c1", "movieId": "test-movie-loc-1", "name": "Vesper", "roleType": "Lead"},
            {"id": "c2", "movieId": "test-movie-loc-1", "name": "Dr. Voss", "roleType": "Supporting"},
            {"id": "c3", "movieId": "test-movie-loc-1", "name": "Saito", "roleType": "Villain"}
        ]

    def test_director_location_intelligence(self):
        """Test Director AI generates scene-mapped location suggestions."""
        intel = gemini_service.generate_director_intelligence(
            movie_id=self.movie["id"],
            title=self.movie["title"],
            genre=self.movie["genre"],
            scenes=self.scenes,
            characters=self.characters
        )
        self.assertIsNotNone(intel)
        structured = intel.get("structuredInsights", {})
        locs = structured.get("locationSuggestions", [])
        self.assertTrue(len(locs) > 0, "Director AI must return location suggestions")
        
        # Verify first location has scene matching and lighting/permit info
        first_loc = locs[0]
        self.assertIn("locationName", first_loc)
        self.assertIn("suggestedPlace", first_loc)
        self.assertIn("settingType", first_loc)
        self.assertIn("matchedSceneNumbers", first_loc)
        print(f"\n[PASS] Director AI Location Suggestion: {first_loc.get('suggestedPlace')} (Scenes: {first_loc.get('matchedSceneNumbers')})")

    def test_producer_location_logistics(self):
        """Test Producer AI generates location logistics with rental rates and consolidation notes."""
        logistics = gemini_service.generate_producer_logistics(
            movie_id=self.movie["id"],
            title=self.movie["title"],
            total_scenes=len(self.scenes),
            budget=self.movie["budget"],
            scenes=self.scenes
        )
        self.assertIsNotNone(logistics)
        locs = logistics.get("locationSuggestions", [])
        self.assertTrue(len(locs) > 0, "Producer AI must return location suggestions with logistics")
        
        first_loc = locs[0]
        self.assertIn("estimatedRentalRate", first_loc)
        self.assertIn("permitRequirements", first_loc)
        self.assertIn("weatherRiskLevel", first_loc)
        print(f"[PASS] Producer AI Location Logistics: {first_loc.get('locationName')} - Rate: {first_loc.get('estimatedRentalRate')} - Risk: {first_loc.get('weatherRiskLevel')}")

    def test_director_role_agent_location_prompt(self):
        """Test RoleAgentOrchestrator handles Director location query."""
        res = role_agent_orchestrator.run_director_agent(
            movie=self.movie,
            scenes=self.scenes,
            characters=self.characters,
            prompt="Suggest suitable locations for the screenplay scenes",
            context_type="LOCATION_SUGGESTION"
        )
        self.assertEqual(res["agentRole"], "DIRECTOR")
        struct = res.get("structuredInsights", {})
        self.assertTrue(len(struct.get("locationSuggestions", [])) > 0)
        print(f"[PASS] Director Agent Location Prompt returned {len(struct.get('locationSuggestions', []))} location items")

    def test_producer_role_agent_location_prompt(self):
        """Test RoleAgentOrchestrator handles Producer location query."""
        res = role_agent_orchestrator.run_producer_agent(
            movie=self.movie,
            budget_data=None,
            schedules=[],
            departments=[],
            weather_data={"location": "Tokyo", "rainProbability": 20, "productionRisk": "LOW"},
            prompt="Analyze script scenes and provide location permits and cost feasibility",
            context_type="LOCATION_SUGGESTION",
            scenes=self.scenes
        )
        self.assertEqual(res["agentRole"], "PRODUCER")
        struct = res.get("structuredInsights", {})
        self.assertTrue(len(struct.get("locationSuggestions", [])) > 0)
        print(f"[PASS] Producer Agent Location Prompt returned {len(struct.get('locationSuggestions', []))} location items")

if __name__ == "__main__":
    unittest.main()
