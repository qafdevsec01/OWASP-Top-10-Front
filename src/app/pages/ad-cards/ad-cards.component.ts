import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NzMessageService, NzNotificationService } from 'ng-zorro-antd';
import { Ad } from 'src/app/shared/ad.model';
import { Car } from 'src/app/shared/car.model';
import * as CartActions from '../../cart-store/cart.actions';
import * as fromApp from '../../store/app.reducer';
import { AdResponse } from './../../interfaces/adResponse.model';
import { AdService } from './../../services/ad.service';
import { CartService } from './../../services/cart.service';
import * as DOMPurify from 'dompurify';

@Component({
  selector: 'app-ad-cards',
  templateUrl: './ad-cards.component.html',
  styleUrls: ['./ad-cards.component.css']
})
export class AdCardsComponent implements OnInit {

  adList: AdResponse[];
  adListOriginal: AdResponse[];
  @ViewChild('searchField') searchField: ElementRef;
  retrievedImage: any;
  retrievedImages: string[] = [];
  base64Data: any;
  loading: boolean = false;
  searchWarningDescription;
  isSanitizingChecked: boolean = true;

  adInfo: AdResponse;
  visibleDrawer = false;

  array = [1, 2, 3, 4];

  constructor(private adService: AdService,
              private message: NzMessageService,
              private store: Store<fromApp.AppState>,
              private cartService: CartService,
              private router: Router,
              private notification: NzNotificationService,
              private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.adService.getAds().subscribe(listOfAds => {
      this.adList = listOfAds;
      this.adList.forEach(ad => {
        if(ad.photos.length != 0) {
          ad.photos.forEach(photo => {
            photo.picByte = "data:image/jpeg;base64," + photo.picByte;
          });
        }
      });
      this.adListOriginal = listOfAds;
    });
  }

  getTitle(ad: AdResponse): string {
    return ad.car.carModel.brandName + " " + ad.car.carModel.modelName;
  }

  getDescription(ad:AdResponse): string {
    return "Model from class " + ad.car.carModel.className + " and fuel type " + ad.car.fuelType
      + ". Gearshift type is " + ad.car.gearshiftType + " with " + ad.car.numberOfGears + " gears."
      + ". Car was already travelled " + ad.car.kilometersTravelled + "km, and owns " + ad.seats
      + (ad.seats > 1 ? " seats for kids." : " seat for kid.");
  }

  addToCart(ad: AdResponse): void {
    this.message.info('Added to cart ['+ ad.car.carModel.brandName + ' ' + ad.car.carModel.modelName +']');
    const car: Car = {
      id: ad.car.id,
      model: ad.car.carModel.modelName,
      brand: ad.car.carModel.brandName,
      carClass: ad.car.carModel.className,
      fuelType: ad.car.fuelType,
      gearshiftType: ad.car.gearshiftType,
      gearshiftNumberOfGears: ad.car.numberOfGears
    };

    const adModel: Ad = {
      id: ad.id,
      photos: ad.photos,
      dateFrom: "",
      dateTo: "",
      timeFrom: "",
      timeTo: "",
      pickUpAddress: ad.agent.address
    };
    let userRole: any;
    this.store.select('auth').subscribe(authData => {
      if(authData !== null) {
        userRole = authData.user.userRole;
      }
    });
    if(userRole === "SIMPLE_USER") {
      this.cartService.cartChanged.next(true);
      this.store.dispatch(new CartActions.AddToCart({
        car: car,
        ad: adModel
      }));
    }
  }

  search(): void {
    let searchValue: string = this.searchField.nativeElement.value;
    let searchingResult: AdResponse[] = [];
    this.adListOriginal.forEach(ad => {
      let carBrandModel: string = ad.car.carModel.brandName + " " + ad.car.carModel.modelName;
      if(carBrandModel.toLowerCase().includes(searchValue.toLowerCase())) {
        searchingResult.push(ad);
      }
    });

    if(searchingResult.length === 0) {
      let warningAlert = document.getElementById("nz_alert_searchResult");
      if(this.isSanitizingChecked) {
        var cleanSearchValue = DOMPurify.sanitize(searchValue);
        this.searchWarningDescription = cleanSearchValue;
      } else {
        this.searchWarningDescription = this.sanitizer.bypassSecurityTrustHtml('<p>'+searchValue+'</p>');
      }
      warningAlert.style.display = "block";

      setTimeout(() => {
        warningAlert.style.display = "none";
        this.reloadSearch();
      }, 3000);
    }

    this.adList = [...searchingResult];
  }

  reloadSearch(): void {
    this.searchField.nativeElement.value = '';
    this.adList = [...this.adListOriginal];
  }

  openDrawer(ad: AdResponse): void {
    this.adInfo = ad;
    this.visibleDrawer = true;
    console.log(ad.photos[0].picByte);
  }

  closeDrawer(): void {
    this.visibleDrawer = false;
  }

}
