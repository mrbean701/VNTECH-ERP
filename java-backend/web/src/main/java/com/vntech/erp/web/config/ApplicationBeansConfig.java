package com.vntech.erp.web.config;

import com.vntech.erp.application.port.out.AdminSystemStore;
import com.vntech.erp.application.port.out.AuditLogPort;
import com.vntech.erp.application.port.out.AdminOpsStore;
import com.vntech.erp.application.port.out.BoqStore;
import com.vntech.erp.application.port.out.BootstrapDataPort;
import com.vntech.erp.application.port.out.FinanceStore;
import com.vntech.erp.application.port.out.HrStore;
import com.vntech.erp.application.port.out.IdGenerator;
import com.vntech.erp.application.port.out.LoginLockout;
import com.vntech.erp.application.port.out.MaterialCatalogStore;
import com.vntech.erp.application.port.out.ModulePermissionStore;
import com.vntech.erp.application.port.out.PasswordHasher;
import com.vntech.erp.application.port.out.ProjectAdminStore;
import com.vntech.erp.application.port.out.ProjectRepository;
import com.vntech.erp.application.port.out.OpsTaskStore;
import com.vntech.erp.application.port.out.ProductionStore;
import com.vntech.erp.application.port.out.ProjectScopeStore;
import com.vntech.erp.application.port.out.PurchaseStore;
import com.vntech.erp.application.port.out.RequestStore;
import com.vntech.erp.application.port.out.SessionStore;
import com.vntech.erp.application.port.out.SupplierStore;
import com.vntech.erp.application.port.out.SystemSettingsStore;
import com.vntech.erp.application.port.out.SystemSetupPort;
import com.vntech.erp.application.port.out.UserAdminStore;
import com.vntech.erp.application.port.out.UserRepository;
import com.vntech.erp.application.port.out.WarehouseStockStore;
import com.vntech.erp.application.rbac.RbacService;
import com.vntech.erp.application.service.AdminOpsManagementUseCase;
import com.vntech.erp.application.service.AdminSystemUseCase;
import com.vntech.erp.application.service.AuthUseCase;
import com.vntech.erp.application.service.BoqManagementUseCase;
import com.vntech.erp.application.service.FinanceManagementUseCase;
import com.vntech.erp.application.service.HrManagementUseCase;
import com.vntech.erp.application.service.BootstrapUseCase;
import com.vntech.erp.application.service.ListActiveProjectsUseCase;
import com.vntech.erp.application.service.ProjectContractUseCase;
import com.vntech.erp.application.service.MaterialCatalogManagementUseCase;
import com.vntech.erp.application.service.OpsTaskManagementUseCase;
import com.vntech.erp.application.service.ProductionManagementUseCase;
import com.vntech.erp.application.service.ProjectManagementUseCase;
import com.vntech.erp.application.service.PurchaseManagementUseCase;
import com.vntech.erp.application.service.RequestManagementUseCase;
import com.vntech.erp.application.service.StockManagementUseCase;
import com.vntech.erp.application.service.SystemSettingsUseCase;
import com.vntech.erp.application.service.SupplierManagementUseCase;
import com.vntech.erp.application.service.UserManagementUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * COMPOSITION ROOT của Clean Architecture: nơi DUY NHẤT wire use-cases (application)
 * với ports/adapters (infrastructure). Use-case giữ nguyên thuần — không cần annotation Spring.
 */
@Configuration
public class ApplicationBeansConfig {

    @Bean
    public AuthUseCase authUseCase(UserRepository userRepository, SessionStore sessionStore,
                                   PasswordHasher passwordHasher, IdGenerator idGenerator,
                                   SystemSetupPort systemSetupPort, LoginLockout loginLockout,
                                   AuditLogPort auditLogPort) {
        return new AuthUseCase(userRepository, sessionStore, passwordHasher, idGenerator,
                systemSetupPort, loginLockout, auditLogPort);
    }

    @Bean
    public RbacService rbacService(ModulePermissionStore modulePermissionStore) {
        return new RbacService(modulePermissionStore);
    }

    @Bean
    public ProjectManagementUseCase projectManagementUseCase(ProjectAdminStore projectAdminStore,
                                                             IdGenerator idGenerator,
                                                             RbacService rbacService) {
        return new ProjectManagementUseCase(projectAdminStore, idGenerator, rbacService);
    }

    @Bean
    public UserManagementUseCase userManagementUseCase(UserAdminStore userAdminStore,
                                                       IdGenerator idGenerator,
                                                       PasswordHasher passwordHasher,
                                                       RbacService rbacService) {
        return new UserManagementUseCase(userAdminStore, idGenerator, passwordHasher, rbacService);
    }


    @Bean
    public ProjectContractUseCase projectContractUseCase(ProjectAdminStore projectAdminStore,
                                                         IdGenerator idGenerator) {
        return new ProjectContractUseCase(projectAdminStore, idGenerator);
    }

    @Bean
    public RequestManagementUseCase requestManagementUseCase(RequestStore requestStore,
                                                             IdGenerator idGenerator,
                                                             RbacService rbacService) {
        return new RequestManagementUseCase(requestStore, idGenerator, rbacService);
    }

    @Bean
    public SupplierManagementUseCase supplierManagementUseCase(SupplierStore supplierStore,
                                                               IdGenerator idGenerator) {
        return new SupplierManagementUseCase(supplierStore, idGenerator);
    }

    @Bean
    public PurchaseManagementUseCase purchaseManagementUseCase(PurchaseStore purchaseStore,
                                                               IdGenerator idGenerator,
                                                               RbacService rbacService) {
        return new PurchaseManagementUseCase(purchaseStore, idGenerator, rbacService);
    }

    @Bean
    public BoqManagementUseCase boqManagementUseCase(BoqStore boqStore, IdGenerator idGenerator) {
        return new BoqManagementUseCase(boqStore, idGenerator);
    }

    @Bean
    public StockManagementUseCase stockManagementUseCase(WarehouseStockStore warehouseStockStore,
                                                         IdGenerator idGenerator,
                                                         RbacService rbacService) {
        return new StockManagementUseCase(warehouseStockStore, idGenerator, rbacService);
    }

    @Bean
    public ProductionManagementUseCase productionManagementUseCase(ProductionStore productionStore,
                                                                   IdGenerator idGenerator,
                                                                   RbacService rbacService) {
        return new ProductionManagementUseCase(productionStore, idGenerator, rbacService);
    }

    @Bean
    public FinanceManagementUseCase financeManagementUseCase(FinanceStore financeStore,
                                                             ProductionStore productionStore,
                                                             IdGenerator idGenerator,
                                                             RbacService rbacService) {
        return new FinanceManagementUseCase(financeStore, productionStore, idGenerator, rbacService);
    }

    @Bean
    public HrManagementUseCase hrManagementUseCase(HrStore hrStore, IdGenerator idGenerator) {
        return new HrManagementUseCase(hrStore, idGenerator);
    }

    @Bean
    public AdminOpsManagementUseCase adminOpsManagementUseCase(AdminOpsStore adminOpsStore,
                                                               ProductionStore productionStore,
                                                               IdGenerator idGenerator,
                                                               RbacService rbacService) {
        return new AdminOpsManagementUseCase(adminOpsStore, productionStore, idGenerator, rbacService);
    }

    @Bean
    public MaterialCatalogManagementUseCase materialCatalogManagementUseCase(MaterialCatalogStore materialCatalogStore,
                                                                             IdGenerator idGenerator,
                                                                             RbacService rbacService) {
        return new MaterialCatalogManagementUseCase(materialCatalogStore, idGenerator, rbacService);
    }

    @Bean
    public OpsTaskManagementUseCase opsTaskManagementUseCase(OpsTaskStore opsTaskStore, IdGenerator idGenerator) {
        return new OpsTaskManagementUseCase(opsTaskStore, idGenerator);
    }

    @Bean
    public SystemSettingsUseCase systemSettingsUseCase(SystemSettingsStore systemSettingsStore,
                                                       IdGenerator idGenerator,
                                                       RbacService rbacService) {
        return new SystemSettingsUseCase(systemSettingsStore, idGenerator, rbacService);
    }
    @Bean
    public AdminSystemUseCase adminSystemUseCase(AdminSystemStore adminSystemStore,
                                                 IdGenerator idGenerator,
                                                 RbacService rbacService,
                                                 UserManagementUseCase userManagementUseCase) {
        return new AdminSystemUseCase(adminSystemStore, idGenerator, rbacService, userManagementUseCase);
    }

    @Bean
    public ListActiveProjectsUseCase listActiveProjectsUseCase(ProjectRepository projectRepository) {
        return new ListActiveProjectsUseCase(projectRepository);
    }

    @Bean
    public BootstrapUseCase bootstrapUseCase(ProjectRepository projectRepository,
                                             ProjectScopeStore projectScopeStore,
                                             BootstrapDataPort bootstrapDataPort) {
        return new BootstrapUseCase(projectRepository, projectScopeStore, bootstrapDataPort);
    }
}