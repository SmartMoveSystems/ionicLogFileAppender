import { NgModule, ModuleWithProviders } from '@angular/core';
import { LogProvider } from './providers/log';
import { IonicModule } from 'ionic-angular';
 
@NgModule({
    imports: [
        // Only if you use elements like ion-content, ion-xyz...
        IonicModule
    ],
    exports: [
        // export the component(s) that you want others to be able to use
        LogProvider
    ]
})
export class IonicLogFileAppenderModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: IonicLogFileAppenderModule,
            providers: [LogProvider]
        };
    }
}