import { NO_ERRORS_SCHEMA, DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { HttpHeaders, HttpErrorResponse } from "@angular/common/http";

import { AdminComponent } from "./admin";
import { AuthenticationService } from "../../services/authenticationService/authenticationService";
import { HttpErrorHandlerService } from "../../services/httpErrorHandlerService/httpErrorHandlerService";
import { UploadService } from "../../services/uploadService/uploadService";

describe("AdminComponent", () => {
    let fixture: ComponentFixture<AdminComponent>;
    let httpMock: HttpTestingController;

    const staleUploadsRequest = { method: "get", url: "/api/admin/staleuploads" };
    const countInvalidAuthTokensRequest = { method: "get", url: "/api/admin/countinvalidauthtokens" };
    const pruneInvalidAuthTokensRequest = { method: "post", url: "/api/admin/pruneinvalidauthtokens" };
    const blockedClansRequest = { method: "get", url: "/api/admin/blockedclans" };

    beforeEach(done => {
        let authenticationService = {
            getAuthHeaders: (): void => void 0,
        };
        let httpErrorHandlerService = {
            logError: (): void => void 0,
            getValidationErrors: (): void => void 0,
        };
        let uploadService = {
            delete: (): void => void 0,
        };

        TestBed.configureTestingModule(
            {
                imports: [
                    FormsModule,
                    HttpClientTestingModule,
                ],
                providers:
                    [
                        { provide: AuthenticationService, useValue: authenticationService },
                        { provide: HttpErrorHandlerService, useValue: httpErrorHandlerService },
                        { provide: UploadService, useValue: uploadService },
                    ],
                declarations: [AdminComponent],
                schemas: [NO_ERRORS_SCHEMA],
            })
            .compileComponents()
            .then(() => {
                httpMock = TestBed.get(HttpTestingController) as HttpTestingController;
                fixture = TestBed.createComponent(AdminComponent);
            })
            .then(done)
            .catch(done.fail);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe("Initialization", () => {
        let authenticationService: AuthenticationService;

        beforeEach(done => {
            authenticationService = TestBed.get(AuthenticationService) as AuthenticationService;
            spyOn(authenticationService, "getAuthHeaders").and.returnValue(Promise.resolve(new HttpHeaders()));

            fixture.detectChanges();
            fixture.whenStable()
                .then(done)
                .catch(done.fail);
        });

        it("should make api calls", () => {
            httpMock.expectOne(blockedClansRequest);
            expect(authenticationService.getAuthHeaders).toHaveBeenCalled();
        });

        it("should show errors when queue data fetch fails", done => {
            httpMock
                .expectOne(blockedClansRequest)
                .flush(null, { status: 500, statusText: "someStatus" });

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    fixture.detectChanges();

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(1);
                    expect(errors[0]).toEqual("Could not fetch blocked clans");
                })
                .then(done)
                .catch(done.fail);
        });
    });

    describe("Stale uploads form", () => {
        let authenticationService: AuthenticationService;
        let container: DebugElement;

        let staleuploads: number[] = [];
        for (let i = 0; i < 1000; i++) {
            staleuploads.push(i);
        }

        beforeEach(done => {
            let containers = fixture.debugElement.queryAll(By.css(".col-md-4"));
            expect(containers.length).toEqual(3);
            container = containers[0];

            authenticationService = TestBed.get(AuthenticationService) as AuthenticationService;
            spyOn(authenticationService, "getAuthHeaders").and.returnValue(Promise.resolve(new HttpHeaders()));

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    fixture.detectChanges();

                    expect(authenticationService.getAuthHeaders).toHaveBeenCalled();
                    (authenticationService.getAuthHeaders as jasmine.Spy).calls.reset();

                    httpMock.expectOne(blockedClansRequest);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should initially just show the fetch button", () => {
            let progressBar = container.query(By.css("ngb-progressbar"));
            expect(progressBar).toBeNull();

            let buttons = container.queryAll(By.css("button"));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");

            let errors = getAllErrors();
            expect(errors.length).toEqual(0);
        });

        it("should fetch stale uploads", done => {
            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    fixture.detectChanges();

                    expect(authenticationService.getAuthHeaders).toHaveBeenCalled();

                    let request = httpMock.expectOne(staleUploadsRequest);

                    // Make a copy so our mock data doesn't get altered
                    request.flush(JSON.parse(JSON.stringify(staleuploads)));

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");
                    expect(buttons[1].nativeElement.textContent.trim()).toEqual("Delete");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should show errors when stale uploads fetch fails", done => {
            let httpErrorHandlerService = TestBed.get(HttpErrorHandlerService) as HttpErrorHandlerService;
            spyOn(httpErrorHandlerService, "getValidationErrors").and.returnValue(["error0", "error1", "error2"]);
            spyOn(httpErrorHandlerService, "logError");

            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(staleUploadsRequest);
                    request.flush(null, { status: 400, statusText: "someStatus" });

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    expect(httpErrorHandlerService.logError).toHaveBeenCalledWith("AdminComponent.fetchStaleUploads.error", jasmine.any(HttpErrorResponse));
                    expect(httpErrorHandlerService.getValidationErrors).toHaveBeenCalledWith(jasmine.any(HttpErrorResponse));

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(1);
                    expect(errors[0]).toEqual("error0;error1;error2");
                })
                .then(done)
                .catch(done.fail);
        });

        it("should delete stale uploads", done => {
            let uploadService = TestBed.get(UploadService) as UploadService;
            spyOn(uploadService, "delete").and.returnValue(Promise.resolve());

            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(staleUploadsRequest);

                    // Make a copy so our mock data doesn't get altered
                    request.flush(JSON.parse(JSON.stringify(staleuploads)));

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);

                    let deleteButton = buttons[1];
                    deleteButton.nativeElement.click();

                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    expect(uploadService.delete).toHaveBeenCalledTimes(staleuploads.length);
                    for (let i = 0; i < staleuploads.length; i++) {
                        expect(uploadService.delete).toHaveBeenCalledWith(staleuploads[i]);
                    }

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(1);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should cancel deletion", done => {
            let unresolvedPromises: (() => void)[] = [];
            let numDeletedStaleUploads = staleuploads.length / 2;
            let uploadService = TestBed.get(UploadService) as UploadService;
            spyOn(uploadService, "delete").and.callFake((uploadId: number) => {
                // Pause half way through
                return uploadId < numDeletedStaleUploads
                    ? Promise.resolve()
                    : new Promise((resolve) => unresolvedPromises.push(resolve));
            });

            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(staleUploadsRequest);

                    // Make a copy so our mock data doesn't get altered
                    request.flush(JSON.parse(JSON.stringify(staleuploads)));

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);

                    let deleteButton = buttons[1];
                    deleteButton.nativeElement.click();

                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let expectedNumberOfDeleteCalls = numDeletedStaleUploads + AdminComponent.numParallelDeletes;
                    expect(uploadService.delete).toHaveBeenCalledTimes(expectedNumberOfDeleteCalls);
                    for (let i = 0; i < expectedNumberOfDeleteCalls; i++) {
                        expect(uploadService.delete).toHaveBeenCalledWith(staleuploads[i]);
                    }

                    (uploadService.delete as jasmine.Spy).calls.reset();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100 * numDeletedStaleUploads / staleuploads.length);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(1);

                    let cancelButton = buttons[0];
                    expect(cancelButton.nativeElement.textContent.trim()).toEqual("Cancel");
                    cancelButton.nativeElement.click();

                    expect(unresolvedPromises.length).toEqual(AdminComponent.numParallelDeletes);
                    for (let i = 0; i < unresolvedPromises.length; i++) {
                        unresolvedPromises[i]();
                    }

                    return fixture.whenStable();
                })
                .then(() => {
                    // Need a 2nd round to update the property
                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    expect(uploadService.delete).not.toHaveBeenCalled();

                    // We will only have let the pending requests finish before stopping
                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100 * (numDeletedStaleUploads + AdminComponent.numParallelDeletes) / staleuploads.length);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");
                    expect(buttons[1].nativeElement.textContent.trim()).toEqual("Delete");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });
    });

    describe("Invalid auth tokens form", () => {
        let authenticationService: AuthenticationService;
        let container: DebugElement;

        const countInvalidAuthTokens = 1234;

        beforeEach(done => {
            let containers = fixture.debugElement.queryAll(By.css(".col-md-4"));
            expect(containers.length).toEqual(3);
            container = containers[1];

            authenticationService = TestBed.get(AuthenticationService) as AuthenticationService;
            spyOn(authenticationService, "getAuthHeaders").and.returnValue(Promise.resolve(new HttpHeaders()));

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    fixture.detectChanges();

                    expect(authenticationService.getAuthHeaders).toHaveBeenCalled();
                    (authenticationService.getAuthHeaders as jasmine.Spy).calls.reset();

                    httpMock.expectOne(blockedClansRequest);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should initially just show the fetch button", () => {
            let progressBar = container.query(By.css("ngb-progressbar"));
            expect(progressBar).toBeNull();

            let buttons = container.queryAll(By.css("button"));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");

            let errors = getAllErrors();
            expect(errors.length).toEqual(0);
        });

        it("should fetch invalid auth tokens", done => {
            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    fixture.detectChanges();

                    expect(authenticationService.getAuthHeaders).toHaveBeenCalled();

                    let request = httpMock.expectOne(countInvalidAuthTokensRequest);
                    request.flush(countInvalidAuthTokens);

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");
                    expect(buttons[1].nativeElement.textContent.trim()).toEqual("Prune");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should show errors when invalid auth tokens fetch fails", done => {
            let httpErrorHandlerService = TestBed.get(HttpErrorHandlerService) as HttpErrorHandlerService;
            spyOn(httpErrorHandlerService, "logError");

            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(countInvalidAuthTokensRequest);
                    request.flush(null, { status: 400, statusText: "someStatus" });

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    expect(httpErrorHandlerService.logError).toHaveBeenCalledWith("AdminComponent.fetchInvalidAuthTokens.error", jasmine.any(HttpErrorResponse));

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(1);
                    expect(errors[0]).toEqual("Something went wrong");
                })
                .then(done)
                .catch(done.fail);
        });

        it("should prune invalid auth tokens", done => {
            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(countInvalidAuthTokensRequest);
                    request.flush(countInvalidAuthTokens);

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);

                    let pruneButton = buttons[1];
                    pruneButton.nativeElement.click();

                    return fixture.whenStable();
                })
                .then(async () => {
                    fixture.detectChanges();

                    for (let i = 0; i < countInvalidAuthTokens; i += AdminComponent.pruneInvalidAuthTokenBatchSize) {
                        httpMock.expectOne(pruneInvalidAuthTokensRequest).flush(null);

                        fixture.detectChanges();
                        await fixture.whenStable();
                        fixture.detectChanges();
                    }

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(1);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });

        it("should cancel pruning", done => {
            let numPrunedInvalidAuthTokens = countInvalidAuthTokens / 2;
            numPrunedInvalidAuthTokens -= numPrunedInvalidAuthTokens % AdminComponent.pruneInvalidAuthTokenBatchSize;

            let fetchButton = container.query(By.css("button"));
            fetchButton.nativeElement.click();

            fixture.detectChanges();
            fixture.whenStable()
                .then(() => {
                    let request = httpMock.expectOne(countInvalidAuthTokensRequest);
                    request.flush(countInvalidAuthTokens);

                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(0);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);

                    let pruneButton = buttons[1];
                    pruneButton.nativeElement.click();

                    return fixture.whenStable();
                })
                .then(async () => {
                    fixture.detectChanges();

                    // Pause half way through
                    for (let i = 0; i < numPrunedInvalidAuthTokens; i += AdminComponent.pruneInvalidAuthTokenBatchSize) {
                        httpMock.expectOne(pruneInvalidAuthTokensRequest).flush(null);

                        fixture.detectChanges();
                        await fixture.whenStable();
                        fixture.detectChanges();
                    }

                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100 * numPrunedInvalidAuthTokens / countInvalidAuthTokens);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(1);

                    let cancelButton = buttons[0];
                    expect(cancelButton.nativeElement.textContent.trim()).toEqual("Cancel");
                    cancelButton.nativeElement.click();

                    // Flush the in-flight request
                    httpMock.expectOne(pruneInvalidAuthTokensRequest).flush(null);
                    numPrunedInvalidAuthTokens += AdminComponent.pruneInvalidAuthTokenBatchSize;

                    await fixture.whenStable();
                })
                .then(() => {
                    // Need a 2nd round to update the property
                    fixture.detectChanges();
                    return fixture.whenStable();
                })
                .then(() => {
                    fixture.detectChanges();

                    // We will only have let the pending requests finish before stopping
                    let progressBar = container.query(By.css("ngb-progressbar"));
                    expect(progressBar).not.toBeNull();
                    expect(progressBar.properties.value).toEqual(100 * numPrunedInvalidAuthTokens / countInvalidAuthTokens);

                    let buttons = container.queryAll(By.css("button"));
                    expect(buttons.length).toEqual(2);
                    expect(buttons[0].nativeElement.textContent.trim()).toEqual("Fetch");
                    expect(buttons[1].nativeElement.textContent.trim()).toEqual("Prune");

                    let errors = getAllErrors();
                    expect(errors.length).toEqual(0);
                })
                .then(done)
                .catch(done.fail);
        });
    });

    function getAllErrors(): string[] {
        let errors: string[] = [];
        let errorElements = fixture.debugElement.queryAll(By.css(".alert-danger"));
        for (let i = 0; i < errorElements.length; i++) {
            errors.push(errorElements[i].nativeElement.textContent.trim());
        }

        return errors;
    }
});
