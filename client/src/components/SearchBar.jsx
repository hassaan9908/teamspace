import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../services/api";

import { useWorkspace } from "../context/WorkspaceContext";

import SearchResults from "./SearchResults";

export default function SearchBar({
  onTaskSelect,
}) {
  const {
    currentWorkspace,
  } = useWorkspace();

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const searchRef =
    useRef(null);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    setQuery("");
    setResults(null);
    setError("");
    setOpen(false);
  }, [
    currentWorkspace?._id,
  ]);

  const handleSearch = async (
    event
  ) => {
    event?.preventDefault();

    if (
      !query.trim() ||
      !currentWorkspace
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOpen(true);

      const response =
        await api.get(
          `/search/workspaces/${currentWorkspace._id}`,
          {
            params: {
              q: query.trim(),
            },
          }
        );

      setResults(response.data);
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Search failed."
      );

      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setError("");
    setOpen(false);
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div
      ref={searchRef}
      className="global-search"
    >
      <form
        onSubmit={handleSearch}
        className="global-search-form"
      >
        <span className="global-search-icon">
          ⌕
        </span>

        <input
          type="search"
          placeholder={`Search ${currentWorkspace.name}...`}
          value={query}
          onFocus={() => {
            if (
              results ||
              error
            ) {
              setOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(
              event.target.value
            );

            if (
              !event.target.value
                .trim()
            ) {
              setResults(null);
              setError("");
              setOpen(false);
            }
          }}
        />

        

        <button
          type="submit"
          className="search-submit-btn"
          disabled={
            loading ||
            !query.trim()
          }
        >
          {loading
            ? "..."
            : "Search"}
        </button>
      </form>

      {open && (
        <div className="search-popover">
          <div className="search-popover-header">
            <div>
              <strong>
                Workspace Search
              </strong>

              {results && (
                <span>
                  {
                    results.counts
                      ?.total
                  }{" "}
                  result
                  {results.counts
                    ?.total === 1
                    ? ""
                    : "s"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
            >
              ✕
            </button>
          </div>

          {loading && (
            <div className="search-state">
              <div className="loader" />

              <span>
                Searching...
              </span>
            </div>
          )}

          {!loading &&
            error && (
              <div className="search-error">
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            results && (
              <div className="search-results-scroll">
                <SearchResults
                  data={
                    results
                  }
                  onTaskSelect={
                    onTaskSelect
                  }
                  onClose={
                    clearSearch
                  }
                />
              </div>
            )}

          {!loading &&
            !error &&
            !results && (
              <div className="search-state">
                <span className="search-state-icon">
                  ⌕
                </span>

                <strong>
                  Search TeamSpace
                </strong>

                <p>
                  Find channel
                  messages, direct
                  messages and
                  tasks.
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}