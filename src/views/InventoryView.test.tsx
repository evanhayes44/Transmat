import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { InventoryView } from "./InventoryView";
import type {
  DestinyItem,
  DestinyItemDefinition,
  DestinyCharacter,
} from "../types/bungie.types";
import { bucketHashes } from "../types/bungie.types";

// vi.hoisted creates values that are available inside vi.mock factory functions,
// which are hoisted before any imports run.
const mockLogout = vi.hoisted(() => vi.fn());
const mockUseInventoryStore = vi.hoisted(() => vi.fn());
const mockUseManifestStore = vi.hoisted(() => vi.fn());
const mockUseCharacterStore = vi.hoisted(() => vi.fn());

vi.mock("../store/authStore", () => ({
  useAuthStore: () => ({ logout: mockLogout }),
}));
vi.mock("../store/characterStore", () => ({
  useCharacterStore: mockUseCharacterStore,
}));
vi.mock("../store/inventoryStore", () => ({
  useInventoryStore: mockUseInventoryStore,
}));
vi.mock("../store/manifestStore", () => ({
  useManifestStore: mockUseManifestStore,
}));
vi.mock("../hooks/useCharacters", () => ({ useCharacters: vi.fn() }));
vi.mock("../hooks/useInventory", () => ({ useInventory: vi.fn() }));
// Mock ItemModal to a simple stub — its own test file covers it in depth.
vi.mock("../components/ItemModal", () => ({
  ItemModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="item-modal">
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

const defaultInventoryState = {
  items: null,
  vaultItems: null,
  characterInventory: null,
  itemInstances: null,
  itemStats: null,
  itemSockets: null,
  itemPlugObjectives: null,
  isLoading: false,
};

function renderView() {
  return render(
    <MemoryRouter>
      <InventoryView />
    </MemoryRouter>,
  );
}

// Shared mock data reused across multiple tests
const mockGjallarhornDef: DestinyItemDefinition = {
  displayProperties: {
    name: "Gjallarhorn",
    icon: "/img/gjallarhorn.png",
    description: "",
  },
  itemType: 3,
  itemSubType: 10,
  inventory: { bucketTypeHash: bucketHashes.power, tierType: 6 },
};

const mockVaultItem: DestinyItem = {
  itemHash: 1274330687,
  itemInstanceId: "inst-vault-1",
  quantity: 1,
  bucketHash: bucketHashes.power,
  state: 0,
};

const mockManifest: Record<string, DestinyItemDefinition> = {
  "1274330687": mockGjallarhornDef,
};

describe("InventoryView", () => {
  beforeEach(() => {
    mockLogout.mockClear();
    mockUseInventoryStore.mockReturnValue({ ...defaultInventoryState });
    mockUseManifestStore.mockReturnValue({ data: null, titleData: null });
    mockUseCharacterStore.mockReturnValue({ characters: null });
  });

  // -------------------------------------------------------------------------
  // Page layout — elements always present regardless of data state
  // -------------------------------------------------------------------------
  describe("layout", () => {
    it("renders the Transmat header title", () => {
      renderView();
      expect(screen.getByText("Transmat")).toBeInTheDocument();
    });

    it("renders the Vault heading", () => {
      renderView();
      expect(screen.getByText("Vault")).toBeInTheDocument();
    });

    it("renders the Logout button", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument();
    });

    it("renders the vault search input", () => {
      renderView();
      expect(
        screen.getByPlaceholderText("Search vault..."),
      ).toBeInTheDocument();
    });

    it("renders the Exotic filter button", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: "Exotic" }),
      ).toBeInTheDocument();
    });

    it("renders the Masterwork filter button", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: "◆ Masterwork" }),
      ).toBeInTheDocument();
    });

    it("renders the Reset button", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: "✕ Reset" }),
      ).toBeInTheDocument();
    });

    it("renders weapon type chips for each weapon type", () => {
      renderView();
      expect(screen.getByRole("button", { name: "Auto" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Hand Cannon" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sniper" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bow" })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Logout button
  // -------------------------------------------------------------------------
  describe("logout button", () => {
    it("calls the logout action when clicked", () => {
      renderView();
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // Sort dropdown
  // -------------------------------------------------------------------------
  describe("sort dropdown", () => {
    it("defaults to Power ↓", () => {
      renderView();
      expect(screen.getByDisplayValue("Power ↓")).toBeInTheDocument();
    });

    it("updates to Power ↑ when selected", () => {
      renderView();
      fireEvent.change(screen.getByDisplayValue("Power ↓"), {
        target: { value: "power-asc" },
      });
      expect(screen.getByDisplayValue("Power ↑")).toBeInTheDocument();
    });

    it("updates to Name A–Z when selected", () => {
      renderView();
      fireEvent.change(screen.getByDisplayValue("Power ↓"), {
        target: { value: "name" },
      });
      expect(screen.getByDisplayValue("Name A–Z")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Search input
  // -------------------------------------------------------------------------
  describe("search input", () => {
    it("starts empty", () => {
      renderView();
      const input = screen.getByPlaceholderText("Search vault...");
      expect((input as HTMLInputElement).value).toBe("");
    });

    it("reflects typed text", () => {
      renderView();
      const input = screen.getByPlaceholderText("Search vault...");
      fireEvent.change(input, { target: { value: "Gjallarhorn" } });
      expect((input as HTMLInputElement).value).toBe("Gjallarhorn");
    });
  });

  // -------------------------------------------------------------------------
  // Filter buttons — toggle active class and reset
  // -------------------------------------------------------------------------
  describe("Exotic filter button", () => {
    it("starts without the active class", () => {
      renderView();
      expect(
        screen.getByRole("button", { name: "Exotic" }).className,
      ).not.toContain("active");
    });

    it("gains the active class after one click", () => {
      renderView();
      const btn = screen.getByRole("button", { name: "Exotic" });
      fireEvent.click(btn);
      expect(btn.className).toContain("active");
    });

    it("loses the active class after a second click", () => {
      renderView();
      const btn = screen.getByRole("button", { name: "Exotic" });
      fireEvent.click(btn);
      fireEvent.click(btn);
      expect(btn.className).not.toContain("active");
    });
  });

  describe("Masterwork filter button", () => {
    it("gains the active class after one click", () => {
      renderView();
      const btn = screen.getByRole("button", { name: "◆ Masterwork" });
      fireEvent.click(btn);
      expect(btn.className).toContain("active");
    });
  });

  describe("Reset button", () => {
    it("clears the search query", () => {
      renderView();
      const input = screen.getByPlaceholderText("Search vault...");
      fireEvent.change(input, { target: { value: "Gjallarhorn" } });
      fireEvent.click(screen.getByRole("button", { name: "✕ Reset" }));
      expect((input as HTMLInputElement).value).toBe("");
    });

    it("removes the active class from the Exotic filter", () => {
      renderView();
      const exoticBtn = screen.getByRole("button", { name: "Exotic" });
      fireEvent.click(exoticBtn);
      expect(exoticBtn.className).toContain("active");
      fireEvent.click(screen.getByRole("button", { name: "✕ Reset" }));
      expect(exoticBtn.className).not.toContain("active");
    });

    it("removes the active class from the Masterwork filter", () => {
      renderView();
      const mwBtn = screen.getByRole("button", { name: "◆ Masterwork" });
      fireEvent.click(mwBtn);
      fireEvent.click(screen.getByRole("button", { name: "✕ Reset" }));
      expect(mwBtn.className).not.toContain("active");
    });

    it("resets the sort back to Power ↓", () => {
      renderView();
      fireEvent.change(screen.getByDisplayValue("Power ↓"), {
        target: { value: "name" },
      });
      fireEvent.click(screen.getByRole("button", { name: "✕ Reset" }));
      expect(screen.getByDisplayValue("Power ↓")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Weapon type chips
  // -------------------------------------------------------------------------
  describe("weapon type chips", () => {
    it("chip gains active class when clicked", () => {
      renderView();
      const autoChip = screen.getByRole("button", { name: "Auto" });
      fireEvent.click(autoChip);
      expect(autoChip.className).toContain("active");
    });

    it("clicking the same chip again deactivates it", () => {
      renderView();
      const autoChip = screen.getByRole("button", { name: "Auto" });
      fireEvent.click(autoChip);
      fireEvent.click(autoChip);
      expect(autoChip.className).not.toContain("active");
    });

    it("only one chip is active at a time — selecting another replaces the active", () => {
      renderView();
      const autoChip = screen.getByRole("button", { name: "Auto" });
      const sniperChip = screen.getByRole("button", { name: "Sniper" });
      fireEvent.click(autoChip);
      fireEvent.click(sniperChip);
      expect(autoChip.className).not.toContain("active");
      expect(sniperChip.className).toContain("active");
    });
  });

  // -------------------------------------------------------------------------
  // Loading skeletons
  // -------------------------------------------------------------------------
  describe("loading state", () => {
    it("renders 3 skeleton character panels when isLoading is true", () => {
      mockUseInventoryStore.mockReturnValue({
        ...defaultInventoryState,
        isLoading: true,
      });
      renderView();
      const skeletonHeaders = document.querySelectorAll(".skeleton-header");
      expect(skeletonHeaders.length).toBe(3);
    });

    it("does not render skeleton panels when isLoading is false", () => {
      renderView();
      expect(document.querySelectorAll(".skeleton-header").length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Character panels
  // -------------------------------------------------------------------------
  describe("character panels", () => {
    function setupCharacter(character: DestinyCharacter) {
      mockUseInventoryStore.mockReturnValue({
        ...defaultInventoryState,
        items: { [character.characterId]: [] },
      });
      mockUseCharacterStore.mockReturnValue({
        characters: { [character.characterId]: character },
      });
    }

    it("renders the character class name (Hunter)", () => {
      setupCharacter({
        characterId: "char-1",
        classType: 1,
        light: 1810,
        emblemBackgroundPath: "/emblem.png",
        raceType: 0,
        genderType: 0,
      });
      renderView();
      expect(screen.getByText("Hunter")).toBeInTheDocument();
    });

    it("renders the character class name (Warlock)", () => {
      setupCharacter({
        characterId: "char-1",
        classType: 2,
        light: 1820,
        emblemBackgroundPath: "/emblem.png",
        raceType: 0,
        genderType: 0,
      });
      renderView();
      expect(screen.getByText("Warlock")).toBeInTheDocument();
    });

    it("renders the character power level", () => {
      setupCharacter({
        characterId: "char-1",
        classType: 0,
        light: 1825,
        emblemBackgroundPath: "/emblem.png",
        raceType: 0,
        genderType: 0,
      });
      renderView();
      expect(screen.getByText("◆ 1825")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Item modal open / close
  // -------------------------------------------------------------------------
  describe("item modal", () => {
    function setupVaultItem() {
      mockUseInventoryStore.mockReturnValue({
        ...defaultInventoryState,
        vaultItems: [mockVaultItem],
      });
      mockUseManifestStore.mockReturnValue({
        data: mockManifest,
        titleData: null,
      });
    }

    it("modal is not shown on initial render", () => {
      renderView();
      expect(screen.queryByTestId("item-modal")).not.toBeInTheDocument();
    });

    it("opens the modal when a vault item is clicked", () => {
      setupVaultItem();
      renderView();
      // The item renders as an img inside a clickable div
      fireEvent.click(screen.getByAltText("Gjallarhorn").parentElement!);
      expect(screen.getByTestId("item-modal")).toBeInTheDocument();
    });

    it("closes the modal when onClose fires", () => {
      setupVaultItem();
      renderView();
      fireEvent.click(screen.getByAltText("Gjallarhorn").parentElement!);
      expect(screen.getByTestId("item-modal")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Close Modal" }));
      expect(screen.queryByTestId("item-modal")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Error states
  // -------------------------------------------------------------------------
  describe("error states", () => {
    it("displays the inventory error message when invError is set", () => {
      mockUseInventoryStore.mockReturnValue({
        ...defaultInventoryState,
        error: "Error loading inventory",
      });
      renderView();
      expect(
        screen.getAllByText("Error loading inventory").length,
      ).toBeGreaterThan(0);
    });

    it("displays the character error message when charError is set", () => {
      mockUseCharacterStore.mockReturnValue({
        characters: null,
        error: "Error fetching character data for store",
      });
      renderView();
      expect(
        screen.getAllByText("Error fetching character data for store").length,
      ).toBeGreaterThan(0);
    });
  });
});
