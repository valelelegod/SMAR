import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from '@capacitor/dialog';
import { IUser } from 'src/app/interfaces/authentication/IUser';
import { IHomeOption } from 'src/app/interfaces/home/IHomeOption';
import { AuthenticationService, PROFILE_KEY } from 'src/app/services/authentication/authentication.service';
import { PRODUCTS_KEY, ProductService } from 'src/app/services/product/product.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    public availableOptions: IHomeOption[] = [
        { name: "Ridicare ambalaje", icon: "car", router: '/packaging' },
        { name: "Istoric saci", icon: "cube", router: '/bag-history' },
        { name: "Istoric vouchere", icon: "cash", router: '/voucher-history' },
        { name: "Sigilare saci", icon: "pricetag", router: '/bags-seal' },
        { name: "Setări", icon: "cog", router: '/settings' },
    ]

    public currentUser: IUser | null = null;
    public isLogged: boolean = false;

    constructor(private router: Router, private authService: AuthenticationService, private storageService: StorageService, private productService: ProductService) {
        this.getUser();
    }

    ionViewDidEnter() {
        this.checkLogged();
    }

    ionViewDidLeave() {
        this.isLogged = false;
    }

    checkLogged() {
        this.authService.isLogged().subscribe({
            next: (isLogged) => {
                if (isLogged && !this.isLogged) {
                    this.isLogged = true;
                    this.authService.doAuth();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    goToRoute(route: string | null) {
        if(!route) return;

        if(route === '/bags-seal' && this.canScan()) {
            this.askSeal(route);
        } else {
            this.router.navigateByUrl(route, { replaceUrl: true });
        }
    }

    async askSeal(route: string) {
        const { value } = await Dialog.confirm({
            title: "Sigilare saci",
            message: "Nu ați atins cantitatea maxima, sigur doriți să sigilați?",
            okButtonTitle: "Da",
            cancelButtonTitle: "Nu",
        });

        if (!value) return;

        this.router.navigateByUrl(route, { replaceUrl: true });
    }

    getUser() {
        this.authService.currentUser.subscribe({
            next: (res) => {
                if (res) {
                    this.currentUser = res;
                    this.getProducts();
                }
            },
            error: (err) => {
                console.log(err);
            }
        })


    }

    getProducts() {
        this.productService.getProducts().subscribe({
            next: (items) => {
                this.storageService.setStorageKey(PRODUCTS_KEY, JSON.stringify(items));
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    goToScan() {
        this.router.navigateByUrl("/scan", { replaceUrl: true });
    }

    getColorForThreshold(type: string) {
        if (!this.currentUser) return 'black';

        if (type === 'plastic') {
            if (this.currentUser.PlasticCount === this.currentUser.PlasticThreshold) return 'orange';
            else if (this.currentUser.PlasticCount > this.currentUser.PlasticThreshold) return 'red';
        } else if (type === 'can') {
            if (this.currentUser.AluminiumCount === this.currentUser.AluminiumThreshold) return 'orange';
            else if (this.currentUser.AluminiumCount > this.currentUser.AluminiumThreshold) return 'red';
        } else if (type === 'glass') {
            if (this.currentUser.GlassCount === this.currentUser.GlassThreshold) return 'orange';
            else if (this.currentUser.GlassCount > this.currentUser.GlassThreshold) return 'red';
        }

        return 'black';
    }

    canScan() {
        if (!this.currentUser) return false;

        return this.currentUser.PlasticCount < this.currentUser.PlasticThreshold && this.currentUser.AluminiumCount < this.currentUser.AluminiumThreshold && this.currentUser.GlassCount < this.currentUser.GlassThreshold;
    }

    logout() {
        this.authService.logout();
    }

    getFormattedEmployeeName(employeeName: string) {
        const employeeNameSplitted = employeeName.split(' ');

        if (employeeNameSplitted.length > 1) {
            const firstName = employeeNameSplitted[0];
            const lastName = employeeNameSplitted[1].charAt(0).toLocaleUpperCase();

            return firstName + ' ' + lastName + '.';
        }

        return employeeName;
    }

}
