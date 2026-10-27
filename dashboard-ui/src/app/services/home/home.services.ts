import { AuthService } from "../auth/auth.services";
import { Observable, defer, forkJoin, map, of } from "rxjs";
import { Injectable, inject } from "@angular/core";
import { API_CONFIG } from "../../config/api.config";
import { ApiClient } from "../api-client/api-client.services";
import { ApiError } from "../../models/api-client.model";
import { BrowserStorage } from "../browser-storage/browser-storage.services";
import { LibraryState } from "../library-state/library-state.services";
import {
  catalog,
  readers,
  mockForYouFeed,
  mockPanelSuggestions,
  mockSuggestionPills,
  getMockProfileData,
  getMockEmptyAccount,
  getMockSearchFeed,
  getMockReaders,
} from "../../mocks/home-mocks";
import type {
  HomeData,
  MangaApiResponse,
  SearchRequest,
  ReaderRequest,
  UserProfileData,
} from "../../models/home-api.model";
import type {
  LibraryState as LibraryStateModel,
  Reader,
  FavouritePanel,
} from "../../models/home.model";

@Injectable({ providedIn: "root" })
export class HomeApi {
  private readonly auth = inject(AuthService);
  private readonly config = inject(API_CONFIG);
  private readonly http = inject(ApiClient);
  private readonly storage = inject(BrowserStorage);
  private readonly library = inject(LibraryState);
  private copy<T>(value: T): T {
    return structuredClone(value);
  }
  // Both adapters are cold: each subscription gets its own response and request.
  getMangaCatalog(): Observable<MangaApiResponse> {
    return defer(() =>
      this.config.useMocks
        ? of(this.copy({ details: catalog }))
        : this.http.requestJson<MangaApiResponse>("/manga"),
    );
  }
  getForYouFeed(): Observable<MangaApiResponse> {
    return defer(() =>
      this.config.useMocks
        ? of(this.copy(mockForYouFeed))
        : this.http.requestJson<MangaApiResponse>("/manga/for-you"),
    );
  }
  getReaders(request: ReaderRequest = {}): Observable<Reader[]> {
    return defer(() => {
      if (this.config.useMocks) return of(this.copy(getMockReaders(request)));
      const params = new URLSearchParams();
      if (request.query) params.set("q", request.query);
      for (const username of request.usernames ?? [])
        params.append("username", username);
      return this.http.requestJson<Reader[]>(
        `/users${params.size ? `?${params}` : ""}`,
      );
    });
  }
  getSearchSuggestions(): Observable<string[]> {
    return defer(() =>
      this.config.useMocks
        ? of(this.copy(mockSuggestionPills))
        : this.http.requestJson<string[]>("/manga/search/suggestions"),
    );
  }
  getHomeData(): Observable<HomeData> {
    return forkJoin({
      manga: this.getMangaCatalog(),
      recommendations: this.getForYouFeed(),
      readers: this.getReaders(),
      suggestions: this.getSearchSuggestions(),
    }).pipe(
      map(({ manga, recommendations, readers, suggestions }) => ({
        catalog: manga.details,
        recommendations: recommendations.details,
        readers,
        suggestions,
      })),
    );
  }
  getSearchFeed(request: SearchRequest): Observable<MangaApiResponse> {
    return defer(() => {
      if (this.config.useMocks)
        return of(this.copy(getMockSearchFeed(request)));
      const params = new URLSearchParams({ q: request.query });
      if (request.genre && request.genre !== "All genres")
        params.set("genre", request.genre);
      if (request.status && request.status !== "All statuses")
        params.set("status", request.status);
      if (request.sort) params.set("sort", request.sort);
      return this.http.requestJson<MangaApiResponse>(`/manga/search?${params}`);
    });
  }
  getUserProfile(username: string): Observable<UserProfileData> {
    return defer(() => {
      if (!this.config.useMocks)
        return this.http.requestJson<UserProfileData>(
          `/users/${encodeURIComponent(username)}/library`,
        );
      const user = this.auth.session()?.user;
      const profile =
        getMockProfileData(username) ??
        (user?.username === username ? getMockEmptyAccount(user) : null);
      if (!profile) throw new ApiError("Reader not found", 404);
      const result = this.copy(profile);
      const saved = this.library.parseLibraryState(
        this.storage.read(this.library.storageKey(username)),
        catalog,
        readers,
      );
      if (saved) result.state = saved;
      result.favouritePanels = this.copy(
        result.state.favouritePanels ?? result.favouritePanels,
      );
      return of(result);
    });
  }
  getPanelSuggestions(): Observable<FavouritePanel[]> {
    return defer(() =>
      this.config.useMocks
        ? of(this.copy(mockPanelSuggestions))
        : this.http.requestJson<FavouritePanel[]>("/manga/panels"),
    );
  }
  saveUserLibrary(
    username: string,
    state: LibraryStateModel,
  ): Observable<LibraryStateModel> {
    return defer(() => {
      if (!this.config.useMocks)
        return this.http.requestJson<LibraryStateModel>(
          `/users/${encodeURIComponent(username)}/library`,
          { method: "PUT", body: state },
        );
      this.storage.write(
        this.library.storageKey(username),
        JSON.stringify(state),
      );
      return of(this.copy(state));
    });
  }
}
