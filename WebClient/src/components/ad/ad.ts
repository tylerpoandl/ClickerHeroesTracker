import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription } from "rxjs";

@Component({
    selector: "ad",
    templateUrl: "./ad.html",
})
export class AdComponent implements OnInit, OnDestroy {
    public rerender = false;

    private subscription: Subscription;

    constructor(
        private readonly router: Router,
        private readonly cdRef: ChangeDetectorRef,
    ) { }

    public ngOnInit(): void {
        this.subscription = this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.rerender = true;
                this.cdRef.detectChanges();
                this.rerender = false;
            }
        });
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}
